'use strict';

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { toUserResponse };
