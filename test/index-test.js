'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const moveSemverTags = require('../src');
const { gitInit, cloneRemote } = require('git-fixtures');
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const sinon = require('sinon');
const {
  getTags
} = require('../src/git');

describe(function() {
  this.timeout(10e3);

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

  async function getTagSha(tag) {
    return (await execa('git', ['show-ref', tag, '--hash'], {
      cwd: tmpPathLocal
    })).stdout;
  }

  async function writeAndTag(...args) {
    let commit = await writeAndCommit();

    await tag(...args);

    return commit;
  }

  async function runTest(options) {
    await pushTags();

    await moveSemverTags({
      cwd: tmpPathLocal,
      ...options
    });
  }

  async function pushTags() {
    await execa('git', ['push', '--set-upstream', 'origin', 'master', '--follow-tags'], {
      cwd: tmpPathLocal
    });
  }

  async function expectTags(expected) {
    let actual = await getTags(tmpPathRemote);

    for (let [commit, tag, message] of expected) {
      expect(actual).to.match(sinon.match.some(sinon.match({
        commit: sinon.match(commit),
        tag,
        ...message ? { message } : {}
      })));
    }
  }

  beforeEach(async function() {
    tmpPathLocal = await gitInit();
    tmpPathRemote = await cloneRemote({ localPath: tmpPathLocal });
  });

  describe('library', function() {
    it('works without floating tags', async function() {
      let v100Commit = await writeAndTag('v1.0.0');
      let v101Commit = await writeAndTag('v1.0.1');
      let v110Commit = await writeAndTag('v1.1.0');
      let v111Commit = await writeAndTag('v1.1.1');
      let v200Commit = await writeAndTag('v2.0.0');
      let v201Commit = await writeAndTag('v2.0.1');
      let v210Commit = await writeAndTag('v2.1.0');
      let v211Commit = await writeAndTag('v2.1.1');

      await runTest();

      await expectTags([
        [v100Commit, 'v1.0.0'],
        [v101Commit, 'v1.0.1'],
        [v101Commit, 'v1.0'],
        [v110Commit, 'v1.1.0'],
        [v111Commit, 'v1.1.1'],
        [v111Commit, 'v1.1'],
        [v111Commit, 'v1'],
        [v200Commit, 'v2.0.0'],
        [v201Commit, 'v2.0.1'],
        [v201Commit, 'v2.0'],
        [v210Commit, 'v2.1.0'],
        [v211Commit, 'v2.1.1'],
        [v211Commit, 'v2.1'],
        [v211Commit, 'v2']
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

      await runTest();

      await expectTags([
        [v100Commit, 'v1.0.0'],
        [v101Commit, 'v1.0.1'],
        [v101Commit, 'v1.0', 'version one dot zero'],
        [v110Commit, 'v1.1.0'],
        [v111Commit, 'v1.1.1'],
        [v111Commit, 'v1.1', 'version one dot one'],
        [v111Commit, 'v1', 'version one'],
        [v200Commit, 'v2.0.0'],
        [v201Commit, 'v2.0.1'],
        [v201Commit, 'v2.0', 'version two dot zero'],
        [v210Commit, 'v2.1.0'],
        [v211Commit, 'v2.1.1'],
        [v211Commit, 'v2.1', 'version two dot one'],
        [v211Commit, 'v2', 'version two']
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

      await runTest({
        copyAnnotations: true
      });

      await expectTags([
        [v100Commit, 'v1.0.0', 'chore(release): 1.0.0'],
        [v101Commit, 'v1.0.1', 'chore(release): 1.0.1'],
        [v101Commit, 'v1.0', 'chore(release): 1.0.1'],
        [v110Commit, 'v1.1.0', 'chore(release): 1.1.0'],
        [v111Commit, 'v1.1.1', 'chore(release): 1.1.1'],
        [v111Commit, 'v1.1', 'chore(release): 1.1.1'],
        [v111Commit, 'v1', 'chore(release): 1.1.1'],
        [v200Commit, 'v2.0.0', 'chore(release): 2.0.0'],
        [v201Commit, 'v2.0.1', 'chore(release): 2.0.1'],
        [v201Commit, 'v2.0', 'chore(release): 2.0.1'],
        [v210Commit, 'v2.1.0', 'chore(release): 2.1.0'],
        [v211Commit, 'v2.1.1', 'chore(release): 2.1.1'],
        [v211Commit, 'v2.1', 'chore(release): 2.1.1'],
        [v211Commit, 'v2', 'chore(release): 2.1.1']
      ]);
    });

    it('doesn\'t regen tags that don\'t need to move', async function() {
      await writeAndTag('v1.0.0');

      await tag('v1');

      let oldSha = await getTagSha('v1');

      await writeAndTag('v2.0.0');

      await runTest();

      let newSha = await getTagSha('v1');

      expect(newSha).to.equal(oldSha);
    });
  });
});
