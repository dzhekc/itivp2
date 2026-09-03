'use strict';

const { NotFoundError } = require('../../../domain/errors');
const { toUserResponse } = require('../../dto/userDto');

class GetCurrentUser {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Пользователь', userId);
    }

    return toUserResponse(user);
  }
}

module.exports = { GetCurrentUser };
