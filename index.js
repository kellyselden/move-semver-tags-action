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
  // let { stdout: tags } = await execa('git', ['tag'], {
  //   cwd: tmpPath
  // });
  let tags = await getTags(tmpPath);

  let majors = new Set();
  let minors = new Set();

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

    majors.add(major);
    minors.add(majorMinor);
  }

  majors = [...majors].map(major => ({
    range: major.toString(),
    getTag({ major }) {
      return `v${major}`;
    }
  }));

  minors = [...minors].map(minor => ({
    range: `~${minor}`,
    getTag({ major, minor }) {
      return `v${major}.${minor}`;
    }
  }));

  let newTags = [];

  for (let {
    range,
    getTag
  } of [...majors, ...minors]) {
    let maxSatisfying = semver.maxSatisfying(tags.map(({ tag }) => tag), range);

    let { stdout: commit } = await execa('git', ['rev-list', '-n', '1', maxSatisfying], {
      cwd: tmpPath
    });

    let originalMessage = await getTagMessage(maxSatisfying, tmpPath);

    let parsed = semver.parse(maxSatisfying);

    let tag = getTag(parsed);

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
