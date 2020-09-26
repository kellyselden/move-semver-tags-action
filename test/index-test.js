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

async function getTagsAtCommit(commit, tmpPath) {
  let tags = (await execa('git', ['tag', '-n99', '--points-at', commit], {
    cwd: tmpPath
  })).stdout;

  tags = tags.split(EOL).map(tag => tag.trim());

  return tags;
}

describe(function() {
  let tmpPath;

  beforeEach(async function() {
    tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });
  });

  it('works without floating tags', async function() {
    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.0.0');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.0');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.1');

    let v1Commit = await getCurrentCommit(tmpPath);

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.0.0');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.1.0');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.1.1');

    await index(tmpPath);

    let v1Tags = await getTagsAtCommit(v1Commit, tmpPath);

    expect(v1Tags).to.deep.equal([
      'v1',
      'v1.1',
      'v1.1.1'
    ]);

    let v2Tags = await getTagsAtCommit('HEAD', tmpPath);

    expect(v2Tags).to.deep.equal([
      'v2',
      'v2.1',
      'v2.1.1'
    ]);
  });

  it('works with floating tags', async function() {
    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.0.0');
    await tag(tmpPath, 'v1', 'version one');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.0');
    await tag(tmpPath, 'v1.1', 'version one dot one');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.1');

    let v1Commit = await getCurrentCommit(tmpPath);

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.0.0');
    await tag(tmpPath, 'v2', 'version two');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.1.0');
    await tag(tmpPath, 'v2.1', 'version two dot one');

    await writeAndCommit(tmpPath);

    await tag(tmpPath, 'v2.1.1');

    await index(tmpPath);

    let v1Tags = await getTagsAtCommit(v1Commit, tmpPath);

    expect(v1Tags).to.deep.equal([
      'v1              version one',
      'v1.1            version one dot one',
      'v1.1.1'
    ]);

    let v2Tags = await getTagsAtCommit('HEAD', tmpPath);

    expect(v2Tags).to.deep.equal([
      'v2              version two',
      'v2.1            version two dot one',
      'v2.1.1'
    ]);
  });
});
