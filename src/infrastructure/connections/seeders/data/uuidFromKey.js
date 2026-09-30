'use strict';

const { createHash } = require('node:crypto');

/**
 * UUID вычисляется из ключа статьи (a1, a2, …), поэтому после повторного
 * сидирования (и в Postgres, и в MongoDB) ссылки /articles/<id> остаются теми же.
 */
function uuidFromKey(key) {
  const hex = createHash('sha1').update(`wiki-seed:${key}`).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

module.exports = { uuidFromKey };
