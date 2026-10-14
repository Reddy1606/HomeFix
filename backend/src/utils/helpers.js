const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const SALT_ROUNDS = 12;

/**
 * Mã hóa mật khẩu bằng bcrypt với salt rounds = 12
 * @param {string} password - Mật khẩu thô
 * @returns {Promise<string>} Mật khẩu đã hash
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * So sánh mật khẩu thô với mật khẩu đã hash
 * @param {string} password - Mật khẩu thô từ user input
 * @param {string} hashedPassword - Mật khẩu đã hash trong DB
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Tạo JWT token
 * @param {Object} payload - Dữ liệu cần encode (id, email, role)
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Xác thực JWT token
 * @param {string} token - JWT token cần verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
