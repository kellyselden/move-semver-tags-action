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

async function writeRandomFile(tmpPath) {
  await writeFile(path.join(tmpPath, Math.random().toString()), Math.random().toString());
}

describe(function() {
  it('works', async function() {
    let tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });

    await writeRandomFile(tmpPath);

    await execa('git', ['add', '.'], {
      cwd: tmpPath
    });

    await execa('git', ['commit', '-m', 'first commit'], {
      cwd: tmpPath
    });

    await execa('git', ['tag', 'v1.0.0'], {
      cwd: tmpPath
    });

    expect(index).to.equal(1);

    let gitStatus = (await execa('git', ['status'], {
      cwd: tmpPath
    })).stdout;

    expect(gitStatus).to.include('working tree clean');
  });
});
