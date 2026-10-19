const Package = require('../models/Package');
const Subscription = require('../models/Subscription');
const { parsePagination, buildPagination } = require('../utils/pagination');

/**
 * @desc    Lấy danh sách các gói dịch vụ công khai
 * @route   GET /api/packages
 * @access  Public
 */
const getPackages = async (req, res, next) => {
  try {
    const packages = await Package.findAll({ activeOnly: true });
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách gói dịch vụ thành công.',
      data: { packages },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin gói thuê bao đang hoạt động của khách hàng
 * @route   GET /api/packages/my-subscription
 * @access  Private (customer)
 */
const getMySubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findActiveByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        has_subscription: !!sub,
        subscription: sub || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Khách hàng đăng ký mua gói dịch vụ
 * @route   POST /api/packages/subscribe
 * @access  Private (customer)
 */
const subscribePackage = async (req, res, next) => {
  try {
    const { package_id, payment_method } = req.body;
    if (!package_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã gói dịch vụ (package_id).',
      });
    }

    const sub = await Subscription.create({
      userId: req.user.id,
      packageId: package_id,
      paymentMethod: payment_method || 'bank_transfer',
    });

    res.status(201).json({
      success: true,
      message: `Đăng ký thành công ${sub.package_name}! Chúc mừng bạn đã được nâng cấp đặc quyền VIP.`,
      data: { subscription: sub },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin lấy danh sách tất cả các gói dịch vụ
 * @route   GET /api/admin/packages
 * @access  Private (admin)
 */
const adminGetPackages = async (req, res, next) => {
  try {
    const packages = await Package.findAll({ activeOnly: false });
    res.status(200).json({
      success: true,
      data: { packages },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin cập nhật thông tin gói dịch vụ
 * @route   PUT /api/admin/packages/:id
 * @access  Private (admin)
 */
const adminUpdatePackage = async (req, res, next) => {
  try {
    const updated = await Package.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói dịch vụ cần cập nhật.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật gói dịch vụ thành công.',
      data: { package: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin xem danh sách khách hàng đăng ký thuê bao & thống kê doanh thu gói
 * @route   GET /api/admin/subscriptions
 * @access  Private (admin)
 */
const adminGetSubscriptions = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const status = req.query.status || null;

    const { subscriptions, total } = await Subscription.findAll({ status, page, limit });
    const stats = await Subscription.getStats();

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thuê bao thành công.',
      data: {
        subscriptions,
        stats,
        pagination: buildPagination({ page, limit, total }),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPackages,
  getMySubscription,
  subscribePackage,
  adminGetPackages,
  adminUpdatePackage,
  adminGetSubscriptions,
};
