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
  let minors = new Set();

  for (let tag of tags) {
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

  for (let {
    range,
    getTag
  } of [...majors, ...minors]) {
    let maxSatisfying = semver.maxSatisfying(tags, range);

    let { stdout: commit } = await execa('git', ['rev-list', '-n', '1', maxSatisfying], {
      cwd: tmpPath
    });

    let originalMessage = await getTagMessage(maxSatisfying, tmpPath);

    let parsed = semver.parse(maxSatisfying);

    let tag = getTag(parsed);

    let newTags = [tag];

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
