'use strict';

const { User } = require('../../../domain/entities/User');
const { ConflictError } = require('../../../domain/errors');
const { toUserResponse } = require('../../dto/userDto');

class RegisterUser {
  constructor({ userRepository, passwordHasher, idGenerator }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.idGenerator = idGenerator;
  }

  async execute({ email, password }) {
    const normalizedEmail = User.validateEmail(email);
    User.validatePassword(password);

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('Пользователь с таким email уже зарегистрирован');
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = new User({
      id: this.idGenerator(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const created = await this.userRepository.create(user);
    return toUserResponse(created);
  }
}

module.exports = { RegisterUser };
