'use strict';

// git for windows doesn't even use windows newlines
// const { EOL } = require('os');
const EOL = /\r?\n/;

async function getTags(tmpPath) {
  let { execa } = await import('execa');

  let { stdout } = await execa('git', [
    'for-each-ref',
    '--sort',
    '-v:refname',
    '--format',
    '%(*objectname) %(tag) %(subject)',
    'refs/tags'
  ], {
    cwd: tmpPath
  });

  let lines = stdout.split(EOL);

  let tags = lines.map(line => {
    let [commit, tag, ...message] = line.split(' ');

    return {
      commit,
      tag,
      message: message.join(' ')
    };
  });

  return tags;
}

module.exports = {
  getTags
};
