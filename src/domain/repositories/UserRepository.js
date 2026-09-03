'use strict';

class UserRepository {
  async findByEmail(email) {
    throw new Error('Не реализовано: findByEmail');
  }

  async findById(id) {
    throw new Error('Не реализовано: findById');
  }

  async create(user) {
    throw new Error('Не реализовано: create');
  }

  async update(user) {
    throw new Error('Не реализовано: update');
  }
}

module.exports = { UserRepository };
