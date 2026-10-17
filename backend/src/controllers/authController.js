const { validationResult } = require('express-validator');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

/**
 * @desc    Đăng ký tài khoản mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password, full_name, phone, role, address } = req.body;

    // Kiểm tra email đã tồn tại
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được sử dụng.',
      });
    }

    // Kiểm tra phone đã tồn tại
    if (phone) {
      const phoneExists = await User.phoneExists(phone);
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng.',
        });
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Tạo user mới
    const user = await User.create({
      email: email.toLowerCase(),
      password_hash,
      full_name,
      phone: phone || null,
      role: role || 'customer', // Mặc định là customer
      address: address || null,
    });

    // Tạo JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    // Kiểm tra tài khoản bị khóa
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.',
      });
    }

    // So sánh password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    // Tạo JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Trả về user info (loại bỏ password_hash)
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin user hiện tại
 * @route   GET /api/auth/me
 * @access  Private (JWT required)
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin cá nhân
 * @route   PUT /api/auth/me
 * @access  Private (JWT required)
 */
const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // Chỉ cho phép cập nhật các trường an toàn
    const allowedFields = ['full_name', 'phone', 'address', 'avatar_url', 'cccd_number'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu nào để cập nhật.',
      });
    }

    // Kiểm tra phone trùng (nếu có thay đổi)
    if (updateData.phone && updateData.phone !== req.user.phone) {
      const phoneExists = await User.phoneExists(updateData.phone);
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng.',
        });
      }
    }

    const updatedUser = await User.update(req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đổi mật khẩu
 * @route   POST /api/auth/change-password
 * @access  Private (JWT required)
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { current_password, new_password } = req.body;

    // Lấy user với password hash
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await comparePassword(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng.',
      });
    }

    // Hash mật khẩu mới
    const newHash = await hashPassword(new_password);
    await User.updatePassword(req.user.id, newHash);

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng ký nâng cấp tài khoản thành Thợ sửa chữa
 * @route   POST /api/auth/become-technician
 * @access  Private
 */
const becomeTechnician = async (req, res, next) => {
  try {
    if (req.user.role === 'technician') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản của bạn đã là Thợ sửa chữa.',
      });
    }

    if (req.user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản Quản trị viên không thể chuyển đổi thành thợ.',
      });
    }

    const { phone, address } = req.body;
    const patch = { role: 'technician' };
    if (phone) patch.phone = phone;
    if (address) patch.address = address;

    const user = await User.update(req.user.id, patch);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Chúc mừng bạn đã đăng ký làm thợ thành công! Hãy bổ sung CCCD tại mục KYC để Admin phê duyệt nhận việc.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  becomeTechnician,
};
