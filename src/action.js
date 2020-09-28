'use strict';

const core = require('@actions/core');
const index = require('.');
const yn = require('yn');

(async() => {
  try {
    let copyAnnotations = yn(core.getInput('copy-annotations'));

    await index({
      copyAnnotations
    });
  } catch (err) {
    core.setFailed(err.message);
  }
})();
