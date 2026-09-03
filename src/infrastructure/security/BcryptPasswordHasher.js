'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class BcryptPasswordHasher {
  async hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain, hash) {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
  }
}

module.exports = { BcryptPasswordHasher };
