'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const index = require('..');
const { createTmpDir } = require('./helpers/tmp');
const { gitInit } = require('git-fixtures');
const execa = require('execa');

describe(function() {
  it('works', async function() {
    let tmpPath = await createTmpDir();

    await gitInit({ cwd: tmpPath });

    expect(index).to.equal(1);
    expect(
      (await execa('git', ['status'], {
        cwd: tmpPath
      })).stdout
    ).to.include('No commits yet');
  });
});
