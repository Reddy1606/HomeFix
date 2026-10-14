const Service = require('../models/Service');
const { parsePagination, buildPagination } = require('../utils/pagination');

// Chỉ cho phép ghi các trường này (không cho client ghi id, created_at...)
const ALLOWED_FIELDS = ['name', 'category', 'description', 'base_price', 'price_unit', 'warranty_days', 'is_active'];

const toBool = (value) => value === true || value === 'true' || value === '1' || value === 1;

// Lấy các trường hợp lệ từ body và ép kiểu
const pickServiceData = (body = {}) => {
  const data = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] === undefined) continue;
    if (field === 'base_price' || field === 'warranty_days') data[field] = Number(body[field]);
    else if (field === 'is_active') data[field] = toBool(body[field]);
    else data[field] = body[field];
  }
  return data;
};

/**
 * @desc    Danh sách dịch vụ cho Admin (gồm cả dịch vụ đã ẩn)
 * @route   GET /api/admin/services?is_active=&category=&search=&sort=&page=&limit=
 * @access  Private (admin)
 */
const getAllServices = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const { category, search, sort } = req.query;
    const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : null;
    const minPrice = req.query.min_price !== undefined ? parseInt(req.query.min_price, 10) : null;
    const maxPrice = req.query.max_price !== undefined ? parseInt(req.query.max_price, 10) : null;

    const { services, total } = await Service.findAll({
      category: category || null,
      search: search || null,
      minPrice,
      maxPrice,
      sort: sort || 'newest',
      includeInactive: true,
      isActive,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách dịch vụ thành công.',
      data: { services, pagination: buildPagination({ page, limit, total }) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chi tiết một dịch vụ (kể cả đã ẩn)
 * @route   GET /api/admin/services/:id
 * @access  Private (admin)
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin dịch vụ thành công.',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo dịch vụ mới
 * @route   POST /api/admin/services
 * @access  Private (admin)
 */
const createService = async (req, res, next) => {
  try {
    const service = await Service.create(pickServiceData(req.body));
    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công!',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật dịch vụ (gửi trường nào cập nhật trường đó). Dùng is_active để ẩn/hiện.
 * @route   PUT /api/admin/services/:id
 * @access  Private (admin)
 *
 * Lưu ý: đổi giá chỉ ảnh hưởng đơn đặt mới, đơn cũ giữ nguyên total_price đã chốt.
 */
const updateService = async (req, res, next) => {
  try {
    const data = pickServiceData(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu nào để cập nhật.',
      });
    }

    const service = await Service.update(req.params.id, data);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật dịch vụ thành công!',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ngừng cung cấp dịch vụ (xóa mềm: is_active = false)
 * @route   DELETE /api/admin/services/:id
 * @access  Private (admin)
 *
 * Không xóa cứng vì bookings.service_id có ON DELETE CASCADE:
 * xóa dịch vụ sẽ xóa luôn toàn bộ đơn đặt lịch liên quan.
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.update(req.params.id, { is_active: false });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã ngừng cung cấp dịch vụ. Dịch vụ được ẩn khỏi danh sách, các đơn cũ vẫn được giữ nguyên.',
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
