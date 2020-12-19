'use strict';

const execa = require('execa');
const semver = require('semver');
const {
  getTags
} = require('./git');

async function moveSemverTags({
  cwd: tmpPath = process.cwd(),
  copyAnnotations
}) {
  let tags = await getTags(tmpPath);

  let tagsObj = {};
  let majorsAndMinors = {};

  for (let {
    commit,
    tag,
    message
  } of tags) {
    tagsObj[tag] = {
      commit,
      message
    };

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

    Object.assign(tagsObj[tag], {
      major: `v${major}`,
      minor: `v${major}.${minor}`
    });
  }

  let newTags = [];

  let tagVersions = tags.map(({ tag }) => tag);

  for (let [tag, range] of Object.entries(majorsAndMinors)) {
    let maxSatisfying = semver.maxSatisfying(tagVersions, range);

    let {
      commit,
      message: originalMessage
    } = tagsObj[maxSatisfying];

    let message;

    if (copyAnnotations) {
      message = originalMessage;
    } else {
      message = tagsObj[tag] ? tagsObj[tag].message : '';
    }

    await execa('git', ['tag', '-a', tag, commit, '--force', '-m', message], {
      cwd: tmpPath
    });

    newTags.push(tag);
  }

  await execa('git', ['push', 'origin', 'tag', ...newTags, '--force'], {
    cwd: tmpPath
  });
}

module.exports = moveSemverTags;
