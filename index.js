'use strict';

const execa = require('execa');
const { EOL } = require('os');
const semver = require('semver');

async function index(tmpPath) {
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

    let majorTag = `v${semver.major(maxSatisfying)}`;
    let minorTag = `v${semver.major(maxSatisfying)}.${semver.minor(maxSatisfying)}`;

    for (let tag of [majorTag, minorTag]) {
      try {
        await execa('git', ['tag', '-d', tag], {
          cwd: tmpPath
        });
      } catch (err) {}

      await execa('git', ['tag', '-a', tag, commit, '-m', ''], {
        cwd: tmpPath
      });
    }
  }
}

module.exports = index;
