'use strict';

const execa = require('execa');
const { EOL } = require('os');
const semver = require('semver');

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
  let { stdout: tags } = await execa('git', ['tag'], {
    cwd: tmpPath
  });

  tags = tags.split(EOL);

  let majors = new Set();

  for (let tag of tags) {
    if (semver.valid(tag) === null) {
      continue;
    }

    let major = semver.major(tag);

    majors.add(major);
  }

  for (let major of majors) {
    let maxSatisfying = semver.maxSatisfying(tags, `^${major}`);

    let { stdout: commit } = await execa('git', ['rev-list', '-n', '1', maxSatisfying], {
      cwd: tmpPath
    });

    let originalMessage = await getTagMessage(maxSatisfying, tmpPath);

    let majorTag = `v${semver.major(maxSatisfying)}`;
    let minorTag = `v${semver.major(maxSatisfying)}.${semver.minor(maxSatisfying)}`;

    let newTags = [majorTag, minorTag];

    for (let tag of newTags) {
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
    }

    await execa('git', ['push', 'origin', 'tag', ...newTags, '--force'], {
      cwd: tmpPath
    });
  }
}

module.exports = index;
