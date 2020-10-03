'use strict';

const execa = require('execa');
const { EOL } = require('os');

async function getTags(tmpPath) {
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

async function getTagMessage(tag, cwd) {
  let message = (await execa('git', ['for-each-ref', `refs/tags/${tag}`, '--format=%(contents)'], {
    cwd
  })).stdout.trim();

  return message;
}

module.exports = {
  getTags,
  getTagMessage
};
