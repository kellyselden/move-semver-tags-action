'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const index = require('..');

describe(function() {
  it('works', function() {
    expect(index).to.equal(1);
  });
});
