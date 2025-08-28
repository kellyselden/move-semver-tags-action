'use strict';

const core = require('@actions/core');
const index = require('.');

(async() => {
  // eslint-disable-next-line prefer-let/prefer-let
  const { default: yn } = await import('yn');

  try {
    await index({
      copyAnnotations: yn(core.getInput('copy-annotations')),
    });
  } catch (err) {
    core.setFailed(err.message);
  }
})();
