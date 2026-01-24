'use strict';

/**
 * Compare two IDs safely (handles BIGINT string/number mismatch)
 * PostgreSQL BIGINT is returned as string by Sequelize, this ensures
 * consistent comparison regardless of type
 * 
 * @param {string|number} id1 - First ID to compare
 * @param {string|number} id2 - Second ID to compare
 * @returns {boolean} - True if IDs are equal
 */
const compareIds = (id1, id2) => {
  if (id1 == null || id2 == null) return false;
  return String(id1) === String(id2);
};

module.exports = {
  compareIds,
};
