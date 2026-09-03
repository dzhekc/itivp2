'use strict';

const { UserRepository } = require('../../domain/repositories/UserRepository');
const { User } = require('../../domain/entities/User');

class SequelizeUserRepository extends UserRepository {
  constructor({ userModel }) {
    super();
    this.userModel = userModel;
  }

  async findByEmail(email) {
    const row = await this.userModel.findOne({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findById(id) {
    const row = await this.userModel.findByPk(id);
    return row ? toDomain(row) : null;
  }

  async create(user) {
    const row = await this.userModel.create(toPersistence(user));
    return toDomain(row);
  }

  async update(user) {
    await this.userModel.update(toPersistence(user), { where: { id: user.id } });
    return this.findById(user.id);
  }
}

function toDomain(row) {
  const plain = row.get({ plain: true });
  return new User({
    ...plain,
    createdAt: plain.createdAt.toISOString(),
    updatedAt: plain.updatedAt.toISOString(),
  });
}

function toPersistence(user) {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    refreshTokenHash: user.refreshTokenHash,
  };
}

module.exports = { SequelizeUserRepository };
