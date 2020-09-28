'use strict';

const core = require('@actions/core');
const index = require('.');
const yn = require('yn');

(async() => {
  try {
    let copyAnnotation = yn(core.getInput('copy-annotation'));

    await index({
      copyAnnotation
    });
  } catch (err) {
    core.setFailed(err.message);
  }
})();
