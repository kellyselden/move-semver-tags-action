'use strict';

const execa = require('execa');

async function index(tmpPath) {
  let { stdout } = await execa('git', ['tag'], {
    cwd: tmpPath
  });

  return stdout;
}

module.exports = index;
