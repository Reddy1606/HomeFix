const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @desc    Lấy danh sách tất cả users (có phân trang)
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role || null;
    const search = req.query.search || null;

    const { users, total } = await User.findAll({ page, limit, role, search });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết 1 user
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xác minh thợ (verify technician KYC)
 * @route   PUT /api/admin/users/:id/verify
 * @access  Private (Admin only)
 */
const verifyUser = async (req, res, next) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trường "verified" phải là true hoặc false.',
      });
    }

    // Kiểm tra user tồn tại
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    if (existingUser.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xác minh tài khoản thợ (technician).',
      });
    }

    const user = await User.verifyTechnician(req.params.id, verified);

    res.status(200).json({
      success: true,
      message: verified ? 'Xác minh thợ thành công!' : 'Đã hủy xác minh thợ.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Khóa hoặc mở khóa tài khoản
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trường "is_active" phải là true hoặc false.',
      });
    }

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    if (existingUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự khóa tài khoản của chính mình.',
      });
    }

    const user = await User.update(req.params.id, { is_active });

    res.status(200).json({
      success: true,
      message: is_active ? 'Đã kích hoạt lại tài khoản thành công!' : 'Đã khóa tài khoản người dùng.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật vai trò (Role) của người dùng (Admin only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['customer', 'technician', 'staff', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Vai trò "${role}" không hợp lệ. Cho phép: ${allowedRoles.join(', ')}.`,
      });
    }

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Không cho phép admin tự giáng quyền của chính mình
    if (existingUser.id === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự giáng quyền quản trị viên của chính mình.',
      });
    }

    const user = await User.update(req.params.id, { role });

    res.status(200).json({
      success: true,
      message: `Đã cập nhật vai trò người dùng thành "${role}".`,
      data: { user },
    });
  } catch (error) {
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Cơ sở dữ liệu Supabase cần cập nhật ràng buộc role để cho phép "staff". Vui lòng kiểm tra migration.sql.',
      });
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  verifyUser,
  toggleUserStatus,
  updateUserRole,
};
