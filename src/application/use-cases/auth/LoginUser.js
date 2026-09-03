'use strict';

const { UnauthorizedError } = require('../../../domain/errors');
const { toUserResponse } = require('../../dto/userDto');

class LoginUser {
  constructor({ userRepository, passwordHasher, tokenService, tokenHasher }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.tokenHasher = tokenHasher;
  }

  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(String(email || '').trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedError('Неверный email или пароль');
    }

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Неверный email или пароль');
    }

    const accessToken = this.tokenService.signAccessToken({ id: user.id, email: user.email });
    const refreshToken = this.tokenService.signRefreshToken({ id: user.id });

    user.setRefreshTokenHash(this.tokenHasher.hash(refreshToken));
    await this.userRepository.update(user);

    return { accessToken, refreshToken, user: toUserResponse(user) };
  }
}

module.exports = { LoginUser };
