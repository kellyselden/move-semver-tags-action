'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const moveSemverTags = require('../src');
const { createTmpDir } = require('./helpers/tmp');
const { gitInit } = require('git-fixtures');
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const sinon = require('sinon');
const {
  getTags
} = require('../src/git');

async function cloneRemote(localPath, remotePath) {
  await execa('git', ['clone', '--bare', localPath, remotePath]);

  await execa('git', ['remote', 'add', 'origin', remotePath], {
    cwd: localPath
  });
}

describe(function() {
  this.timeout(5e3);

  let tmpPathLocal;
  let tmpPathRemote;

  async function writeRandomFile() {
    await writeFile(path.join(tmpPathLocal, Math.random().toString()), Math.random().toString());
  }

  async function addAndCommit() {
    await execa('git', ['add', '.'], {
      cwd: tmpPathLocal
    });

    let result = (await execa('git', ['commit', '-m', 'foo'], {
      cwd: tmpPathLocal
    })).stdout;

    let commit = result.match(/^\[master .*([^ ]+)\] /)[1];

    return commit;
  }

  async function writeAndCommit() {
    await writeRandomFile();

    return await addAndCommit();
  }

  async function tag(tag, message = '') {
    await execa('git', ['tag', tag, '-m', message], {
      cwd: tmpPathLocal
    });
  }

  async function writeAndTag(...args) {
    let commit = await writeAndCommit();

    await tag(...args);

    return commit;
  }

  async function pushTags() {
    await execa('git', ['push', '--set-upstream', 'origin', 'master', '--follow-tags'], {
      cwd: tmpPathLocal
    });
  }

  async function expectTags(expected) {
    let actual = await getTags(tmpPathRemote);

    for (let tag of expected) {
      expect(actual).to.match(sinon.match.some(sinon.match({
        ...tag,
        commit: sinon.match(tag.commit)
      })));
    }
  }

  beforeEach(async function() {
    tmpPathLocal = await createTmpDir();
    tmpPathRemote = await createTmpDir();

    await gitInit({ cwd: tmpPathLocal });

    await cloneRemote(tmpPathLocal, tmpPathRemote);
  });

  it('works without floating tags', async function() {
    let v100Commit = await writeAndTag('v1.0.0');
    let v101Commit = await writeAndTag('v1.0.1');
    let v110Commit = await writeAndTag('v1.1.0');
    let v111Commit = await writeAndTag('v1.1.1');
    let v200Commit = await writeAndTag('v2.0.0');
    let v201Commit = await writeAndTag('v2.0.1');
    let v210Commit = await writeAndTag('v2.1.0');
    let v211Commit = await writeAndTag('v2.1.1');

    await pushTags();

    await moveSemverTags({ cwd: tmpPathLocal });

    await expectTags([
      {
        commit: v100Commit,
        tag: 'v1.0.0'
      },
      {
        commit: v101Commit,
        tag: 'v1.0.1'
      },
      {
        commit: v101Commit,
        tag: 'v1.0'
      },
      {
        commit: v110Commit,
        tag: 'v1.1.0'
      },
      {
        commit: v111Commit,
        tag: 'v1.1.1'
      },
      {
        commit: v111Commit,
        tag: 'v1.1'
      },
      {
        commit: v111Commit,
        tag: 'v1'
      },
      {
        commit: v200Commit,
        tag: 'v2.0.0'
      },
      {
        commit: v201Commit,
        tag: 'v2.0.1'
      },
      {
        commit: v201Commit,
        tag: 'v2.0'
      },
      {
        commit: v210Commit,
        tag: 'v2.1.0'
      },
      {
        commit: v211Commit,
        tag: 'v2.1.1'
      },
      {
        commit: v211Commit,
        tag: 'v2.1'
      },
      {
        commit: v211Commit,
        tag: 'v2'
      }
    ]);
  });

  it('works with floating tags', async function() {
    let v100Commit = await writeAndTag('v1.0.0');

    await tag('v1.0', 'version one dot zero');
    await tag('v1', 'version one');

    let v101Commit = await writeAndTag('v1.0.1');
    let v110Commit = await writeAndTag('v1.1.0');

    await tag('v1.1', 'version one dot one');

    let v111Commit = await writeAndTag('v1.1.1');
    let v200Commit = await writeAndTag('v2.0.0');

    await tag('v2.0', 'version two dot zero');
    await tag('v2', 'version two');

    let v201Commit = await writeAndTag('v2.0.1');
    let v210Commit = await writeAndTag('v2.1.0');

    await tag('v2.1', 'version two dot one');

    let v211Commit = await writeAndTag('v2.1.1');

    await pushTags();

    await moveSemverTags({ cwd: tmpPathLocal });

    await expectTags([
      {
        commit: v100Commit,
        tag: 'v1.0.0'
      },
      {
        commit: v101Commit,
        tag: 'v1.0.1'
      },
      {
        commit: v101Commit,
        tag: 'v1.0',
        message: 'version one dot zero'
      },
      {
        commit: v110Commit,
        tag: 'v1.1.0'
      },
      {
        commit: v111Commit,
        tag: 'v1.1.1'
      },
      {
        commit: v111Commit,
        tag: 'v1.1',
        message: 'version one dot one'
      },
      {
        commit: v111Commit,
        tag: 'v1',
        message: 'version one'
      },
      {
        commit: v200Commit,
        tag: 'v2.0.0'
      },
      {
        commit: v201Commit,
        tag: 'v2.0.1'
      },
      {
        commit: v201Commit,
        tag: 'v2.0',
        message: 'version two dot zero'
      },
      {
        commit: v210Commit,
        tag: 'v2.1.0'
      },
      {
        commit: v211Commit,
        tag: 'v2.1.1'
      },
      {
        commit: v211Commit,
        tag: 'v2.1',
        message: 'version two dot one'
      },
      {
        commit: v211Commit,
        tag: 'v2',
        message: 'version two'
      }
    ]);
  });

  it('can copy the annotation', async function() {
    let v100Commit = await writeAndTag('v1.0.0', 'chore(release): 1.0.0');
    let v101Commit = await writeAndTag('v1.0.1', 'chore(release): 1.0.1');
    let v110Commit = await writeAndTag('v1.1.0', 'chore(release): 1.1.0');
    let v111Commit = await writeAndTag('v1.1.1', 'chore(release): 1.1.1');
    let v200Commit = await writeAndTag('v2.0.0', 'chore(release): 2.0.0');
    let v201Commit = await writeAndTag('v2.0.1', 'chore(release): 2.0.1');
    let v210Commit = await writeAndTag('v2.1.0', 'chore(release): 2.1.0');
    let v211Commit = await writeAndTag('v2.1.1', 'chore(release): 2.1.1');

    await pushTags();

    await moveSemverTags({
      cwd: tmpPathLocal,
      copyAnnotations: true
    });

    await expectTags([
      {
        commit: v100Commit,
        tag: 'v1.0.0',
        message: 'chore(release): 1.0.0'
      },
      {
        commit: v101Commit,
        tag: 'v1.0.1',
        message: 'chore(release): 1.0.1'
      },
      {
        commit: v101Commit,
        tag: 'v1.0',
        message: 'chore(release): 1.0.1'
      },
      {
        commit: v110Commit,
        tag: 'v1.1.0',
        message: 'chore(release): 1.1.0'
      },
      {
        commit: v111Commit,
        tag: 'v1.1.1',
        message: 'chore(release): 1.1.1'
      },
      {
        commit: v111Commit,
        tag: 'v1.1',
        message: 'chore(release): 1.1.1'
      },
      {
        commit: v111Commit,
        tag: 'v1',
        message: 'chore(release): 1.1.1'
      },
      {
        commit: v200Commit,
        tag: 'v2.0.0',
        message: 'chore(release): 2.0.0'
      },
      {
        commit: v201Commit,
        tag: 'v2.0.1',
        message: 'chore(release): 2.0.1'
      },
      {
        commit: v201Commit,
        tag: 'v2.0',
        message: 'chore(release): 2.0.1'
      },
      {
        commit: v210Commit,
        tag: 'v2.1.0',
        message: 'chore(release): 2.1.0'
      },
      {
        commit: v211Commit,
        tag: 'v2.1.1',
        message: 'chore(release): 2.1.1'
      },
      {
        commit: v211Commit,
        tag: 'v2.1',
        message: 'chore(release): 2.1.1'
      },
      {
        commit: v211Commit,
        tag: 'v2',
        message: 'chore(release): 2.1.1'
      }
    ]);
  });
});
