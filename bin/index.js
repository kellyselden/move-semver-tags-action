#!/usr/bin/env node
'use strict';

const index = require('../src');
const defaults = require('../src/defaults');

const { argv } = require('yargs')
  .options({
    'copy-annotations': {
      description: 'Copy the annotation from the latest tag',
      type: 'boolean',
      default: defaults.copyAnnotations
    }
  });

index(argv);
