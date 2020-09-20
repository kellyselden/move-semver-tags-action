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

async function tag(tmpPath, tag) {
  await execa('git', ['tag', tag], {
    cwd: tmpPath
  });
}

describe(function() {
  it('works without floating tags', async function() {
    let tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });

    await writeRandomFile(tmpPath);

    await addAndCommit(tmpPath);

    await tag(tmpPath, 'v1.0.0');

    await writeRandomFile(tmpPath);

    await addAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.0');

    await writeRandomFile(tmpPath);

    await addAndCommit(tmpPath);

    await tag(tmpPath, 'v1.1.1');

    await index(tmpPath);

    let tags = (await execa('git', ['tag', '--points-at', 'HEAD'], {
      cwd: tmpPath
    })).stdout;

    tags = tags.split(EOL);

    expect(tags).to.deep.equal([
      'v1',
      'v1.1',
      'v1.1.1'
    ]);
  });
});
