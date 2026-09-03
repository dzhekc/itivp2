'use strict';

const { User } = require('../../../domain/entities/User');
const { NotFoundError, UnauthorizedError } = require('../../../domain/errors');

class ChangePassword {
  constructor({ userRepository, passwordHasher }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ userId, oldPassword, newPassword }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Пользователь', userId);
    }

    const matches = await this.passwordHasher.compare(oldPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError('Неверный текущий пароль');
    }

    User.validatePassword(newPassword);

    user.setPasswordHash(await this.passwordHasher.hash(newPassword));
    await this.userRepository.update(user);

    return { success: true };
  }
}

module.exports = { ChangePassword };
