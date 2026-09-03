'use strict';

const { UnauthorizedError } = require('../../../domain/errors');

class RefreshTokens {
  constructor({ userRepository, tokenService, tokenHasher }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.tokenHasher = tokenHasher;
  }

  async execute({ refreshToken }) {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Невалидный или просроченный refresh-токен');
    }

    const user = await this.userRepository.findById(payload.id);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Невалидный или просроченный refresh-токен');
    }

    const matches = this.tokenHasher.verify(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedError('Невалидный или просроченный refresh-токен');
    }

    const accessToken = this.tokenService.signAccessToken({ id: user.id, email: user.email });
    const newRefreshToken = this.tokenService.signRefreshToken({ id: user.id });

    user.setRefreshTokenHash(this.tokenHasher.hash(newRefreshToken));
    await this.userRepository.update(user);

    return { accessToken, refreshToken: newRefreshToken };
  }
}

module.exports = { RefreshTokens };
