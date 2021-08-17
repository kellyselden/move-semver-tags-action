'use strict';

const core = require('@actions/core');
const index = require('.');

(async() => {
  // eslint-disable-next-line prefer-let/prefer-let
  const { default: yn } = await import('yn');

  try {
    let copyAnnotations = yn(core.getInput('copy-annotations'));

    await index({
      copyAnnotations
    });
  } catch (err) {
    core.setFailed(err.message);
  }
})();
