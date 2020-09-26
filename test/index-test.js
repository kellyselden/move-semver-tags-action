'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const index = require('..');
const { createTmpDir } = require('./helpers/tmp');
const { gitInit } = require('git-fixtures');
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const { EOL } = require('os');

async function writeRandomFile(tmpPath) {
  await writeFile(path.join(tmpPath, Math.random().toString()), Math.random().toString());
}

async function addAndCommit(tmpPath) {
  await execa('git', ['add', '.'], {
    cwd: tmpPath
  });

  await execa('git', ['commit', '-m', 'foo'], {
    cwd: tmpPath
  });
}

async function tag(tmpPath, tag, message = '') {
  await execa('git', ['tag', tag, '-m', message], {
    cwd: tmpPath
  });
}

async function getCurrentCommit(tmpPath) {
  return (await execa('git', ['rev-parse', 'HEAD'], {
    cwd: tmpPath
  })).stdout;
}

async function writeAndCommit(tmpPath) {
  await writeRandomFile(tmpPath);

  await addAndCommit(tmpPath);
}

async function cloneRemote(localPath, remotePath) {
  await execa('git', ['clone', '--bare', localPath, remotePath]);

  await execa('git', ['remote', 'add', 'origin', remotePath], {
    cwd: localPath
  });
}

async function pushTags(tmpPath) {
  await execa('git', ['push', '--set-upstream', 'origin', 'master'], {
    cwd: tmpPath
  });

  await execa('git', ['push', '--tags'], {
    cwd: tmpPath
  });
}

async function getTagsAtCommit(commit, tmpPath) {
  let tags = (await execa('git', ['tag', '-n99', '--points-at', commit], {
    cwd: tmpPath
  })).stdout;

  tags = tags.split(EOL).map(tag => tag.trim());

  return tags;
}

describe(function() {
  let tmpPathLocal;
  let tmpPathRemote;

  beforeEach(async function() {
    tmpPathLocal = await createTmpDir();
    tmpPathRemote = await createTmpDir();

    await gitInit({ cwd: tmpPathLocal });

    await cloneRemote(tmpPathLocal, tmpPathRemote);
    // await gitInit({ cwd: tmpPathRemote });

    // await execa('git', ['remote', 'add', 'origin', tmpPathRemote], {
    //   cwd: tmpPathLocal
    // });
  });

  it('works without floating tags', async function() {
    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.0.0');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.1.0');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.1.1');

    let v1Commit = await getCurrentCommit(tmpPathLocal);

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.0.0');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.1.0');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.1.1');

    await pushTags(tmpPathLocal);

    await index(tmpPathLocal);

    let v1Tags = await getTagsAtCommit(v1Commit, tmpPathRemote);

    expect(v1Tags).to.deep.equal([
      'v1',
      'v1.1',
      'v1.1.1'
    ]);

    let v2Tags = await getTagsAtCommit('HEAD', tmpPathRemote);

    expect(v2Tags).to.deep.equal([
      'v2',
      'v2.1',
      'v2.1.1'
    ]);
  });

  it('works with floating tags', async function() {
    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.0.0');
    await tag(tmpPathLocal, 'v1', 'version one');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.1.0');
    await tag(tmpPathLocal, 'v1.1', 'version one dot one');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v1.1.1');

    await pushTags(tmpPathLocal);

    let v1Commit = await getCurrentCommit(tmpPathRemote);

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.0.0');
    await tag(tmpPathLocal, 'v2', 'version two');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.1.0');
    await tag(tmpPathLocal, 'v2.1', 'version two dot one');

    await writeAndCommit(tmpPathLocal);

    await tag(tmpPathLocal, 'v2.1.1');

    await pushTags(tmpPathLocal);

    await index(tmpPathLocal);

    let v1Tags = await getTagsAtCommit(v1Commit, tmpPathRemote);

    expect(v1Tags).to.deep.equal([
      'v1              version one',
      'v1.1            version one dot one',
      'v1.1.1'
    ]);

    let v2Tags = await getTagsAtCommit('HEAD', tmpPathRemote);

    expect(v2Tags).to.deep.equal([
      'v2              version two',
      'v2.1            version two dot one',
      'v2.1.1'
    ]);
  });
});
