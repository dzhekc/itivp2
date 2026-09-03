'use strict';

const { createHash, timingSafeEqual } = require('node:crypto');

class Sha256TokenHasher {
  hash(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  verify(token, hash) {
    if (!token || !hash) return false;
    const actual = Buffer.from(this.hash(token), 'hex');
    const expected = Buffer.from(hash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

module.exports = { Sha256TokenHasher };
