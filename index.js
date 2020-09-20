'use strict';

const execa = require('execa');
const { EOL } = require('os');

async function index(tmpPath) {
  let { stdout } = await execa('git', ['tag'], {
    cwd: tmpPath
  });

  let tags = stdout.split(EOL);

  return tags;
}

module.exports = index;
