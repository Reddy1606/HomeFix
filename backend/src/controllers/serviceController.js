const Service = require('../models/Service');
const { parsePagination, buildPagination } = require('../utils/pagination');

/**
 * @desc    Danh sách dịch vụ đang hoạt động (lọc, tìm kiếm, sắp xếp, phân trang)
 * @route   GET /api/services?category=&search=&min_price=&max_price=&sort=&page=&limit=
 * @access  Public
 */
const getServices = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 50);
    const { category, search, sort } = req.query;
    const minPrice = req.query.min_price !== undefined ? parseInt(req.query.min_price, 10) : null;
    const maxPrice = req.query.max_price !== undefined ? parseInt(req.query.max_price, 10) : null;

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: [{ field: 'min_price', message: 'min_price không được lớn hơn max_price.' }],
      });
    }

    const { services, total } = await Service.findAll({
      category: category || null,
      search: search || null,
      minPrice,
      maxPrice,
      sort: sort || 'category',
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
 * @desc    Danh sách danh mục dịch vụ kèm số lượng (để làm bộ lọc / tab)
 * @route   GET /api/services/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Service.getCategories();
    res.status(200).json({
      success: true,
      message: 'Lấy danh mục dịch vụ thành công.',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chi tiết một dịch vụ
 * @route   GET /api/services/:id
 * @access  Public (chỉ dịch vụ đang hoạt động)
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    // Dịch vụ đã ẩn được coi như không tồn tại với khách hàng
    if (!service || !service.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ.',
      });
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

module.exports = { getServices, getCategories, getServiceById };
