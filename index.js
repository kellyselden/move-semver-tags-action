'use strict';

const execa = require('execa');
const { EOL } = require('os');
const semver = require('semver');

async function index(tmpPath) {
  let { stdout: tags } = await execa('git', ['tag'], {
    cwd: tmpPath
  });

  tags = tags.split(EOL);

  let maxSatisfying = semver.maxSatisfying(tags, '^1');

  let { stdout: commit } = await execa('git', ['rev-list', '-n', '1', maxSatisfying], {
    cwd: tmpPath
  });

  for (let tag of ['v1', 'v1.1']) {
    await execa('git', ['tag', '-a', tag, commit, '-m', ''], {
      cwd: tmpPath
    });
  }
}

module.exports = index;
