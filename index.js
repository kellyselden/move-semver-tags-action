'use strict';

const _execa = require('execa');
const { EOL } = require('os');
const semver = require('semver');

async function execa() {
  let before = new Date().getTime();
  console.log([...arguments].join(' '));
  try {
    return await _execa(...arguments);
  } finally {
    console.log(new Date().getTime() - before);
  }
}

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
    let commit = line.substring(0, line.indexOf(' '));
    let tag = line.substring(line.indexOf(' ') + 1, line.indexOf(' ', line.indexOf(' ') + 1));
    let message = line.substring(line.indexOf(' ', line.indexOf(' ') + 1) + 1);

    return {
      commit,
      tag,
      message
    };
  });

  return tags;
}

// git log --tags --no-walk --pretty='%H %D %s'
// git for-each-ref --sort -v:refname --format '%(*objectname) %(tag) %(subject)' refs/tags

async function getTagMessage(tag, cwd) {
  let message = (await execa('git', ['for-each-ref', `refs/tags/${tag}`, '--format=%(contents)'], {
    cwd
  })).stdout.trim();

  return message;
}

async function index({
  cwd: tmpPath,
  copyAnnotation
}) {
  let tags = await getTags(tmpPath);

  let tagsObj = {};
  let majorsAndMinors = {};

  for (let {
    commit,
    tag,
    message
  } of tags) {
    if (semver.valid(tag) === null) {
      continue;
    }

    let parsed = semver.parse(tag);

    let {
      major,
      minor
    } = parsed;

    let majorMinor = `${major}.${minor}`;

    majorsAndMinors[`v${major}`] = major.toString();
    majorsAndMinors[`v${major}.${minor}`] = `~${majorMinor}`;

    tagsObj[tag] = {
      major: `v${major}`,
      minor: `v${major}.${minor}`,
      commit,
      message
    };
  }

  let newTags = [];

  for (let [tag, range] of Object.entries(majorsAndMinors)) {
    let maxSatisfying = semver.maxSatisfying(tags.map(({ tag }) => tag), range);

    let {
      commit,
      message: originalMessage
    } = tagsObj[maxSatisfying];

    let message;

    if (copyAnnotation) {
      message = originalMessage;
    } else {
      message = await getTagMessage(tag, tmpPath);
    }

    try {
      await execa('git', ['tag', '-d', tag], {
        cwd: tmpPath
      });
    } catch (err) {}

    await execa('git', ['tag', '-a', tag, commit, '-m', message], {
      cwd: tmpPath
    });

    newTags.push(tag);
  }

  await execa('git', ['push', 'origin', 'tag', ...newTags, '--force'], {
    cwd: tmpPath
  });
}

module.exports = index;
