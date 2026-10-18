const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { STATUS_LABELS } = require('../utils/bookingStatus');
const { vnDateString } = require('../utils/date');

/**
 * @desc    Lấy danh sách các đơn việc khách hàng mới đặt đang chờ nhận việc
 * @route   GET /api/technician/jobs/available
 * @access  Private (Chỉ thợ - technician)
 */
const getAvailableJobs = async (req, res, next) => {
  try {
    const tech = await User.findById(req.user.id);
    if (!tech || tech.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản thợ sửa chữa mới có thể truy cập danh sách việc.',
      });
    }

    // Nếu thợ chưa KYC
    if (!tech.is_verified) {
      return res.status(200).json({
        success: true,
        message: 'Tài khoản của bạn chưa được xác minh KYC. Hãy hoàn tất hồ sơ để nhận việc.',
        data: {
          bookings: [],
          pagination: buildPagination({ page: 1, limit: 20, total: 0 }),
          is_verified: false,
        },
      });
    }

    const { page, limit } = parsePagination(req.query, 20);

    // Lấy các đơn pending chưa có thợ
    const { bookings, total } = await Booking.findAll({
      status: 'pending',
      page,
      limit,
    });

    // Lọc chỉ lấy đơn chưa có ai nhận (technician_id === null)
    const available = (bookings || []).filter((b) => !b.technician_id);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách việc mới thành công.',
      data: {
        bookings: available,
        pagination: buildPagination({ page, limit, total: available.length }),
        is_verified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thợ chủ động nhận một đơn việc (tức thì hoặc hẹn trước)
 * @route   POST /api/technician/jobs/:id/claim
 * @access  Private (Chỉ thợ đã KYC)
 */
const claimJob = async (req, res, next) => {
  try {
    const tech = await User.findById(req.user.id);
    if (!tech || tech.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản thợ sửa chữa mới có thể nhận việc.',
      });
    }

    if (!tech.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đang bị khóa, không thể nhận việc.',
      });
    }

    if (!tech.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Hồ sơ KYC của bạn chưa được Admin phê duyệt. Không thể nhận đơn việc.',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt lịch.',
      });
    }

    if (booking.status !== 'pending' || booking.technician_id) {
      return res.status(400).json({
        success: false,
        message: 'Đơn việc này đã có thợ khác tiếp nhận hoặc không còn khả dụng.',
      });
    }

    // Cập nhật trạng thái sang confirmed và gán cho thợ này
    const updated = await Booking.update(
      booking.id,
      {
        technician_id: tech.id,
        status: 'confirmed',
      },
      { expectedStatus: 'pending' }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Đơn việc vừa được thợ khác nhận trước. Vui lòng chọn đơn khác.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nhận việc thành công! Hãy liên hệ khách hàng và chuẩn bị công cụ tới sửa chữa.',
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các đơn việc thợ đã nhận hoặc được Admin giao
 * @route   GET /api/technician/jobs/my
 * @access  Private (Chỉ thợ)
 */
const getMyJobs = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const status = req.query.status || null;

    const { bookings, total } = await Booking.findAll({
      technicianId: req.user.id,
      status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách công việc của tôi thành công.',
      data: {
        bookings,
        pagination: buildPagination({ page, limit, total }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thợ cập nhật tiến độ công việc (Đã tới nơi/Đang làm -> Hoàn thành)
 * @route   PUT /api/technician/jobs/:id/status
 * @access  Private (Chỉ thợ đang phụ trách đơn)
 */
const updateJobStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    const allowed = ['in_progress', 'completed'];

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Thợ chỉ có thể cập nhật sang "in_progress" (Bắt đầu làm) hoặc "completed" (Hoàn thành).',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt lịch.',
      });
    }

    // Kiểm tra đơn có phải của thợ này không
    if (booking.technician_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là thợ được phân công cho đơn này.',
      });
    }

    // Kiểm tra chuyển trạng thái hợp lệ
    // confirmed -> in_progress
    // in_progress -> completed
    if (newStatus === 'in_progress' && booking.status !== 'confirmed' && booking.status !== 'warranty_claim') {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${STATUS_LABELS[booking.status]}" sang "${STATUS_LABELS[newStatus]}". Đơn phải ở trạng thái "Thợ đang đến" hoặc "Yêu cầu bảo hành".`,
      });
    }

    if (newStatus === 'completed' && booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Không thể hoàn thành đơn khi chưa bắt đầu sửa chữa (trạng thái hiện tại: "${STATUS_LABELS[booking.status]}").`,
      });
    }

    const patch = { status: newStatus };

    // Tự động tính thời hạn bảo hành khi hoàn thành lần đầu
    if (newStatus === 'completed' && !booking.warranty_until) {
      const service = await Service.findById(booking.service_id);
      patch.warranty_until = vnDateString(service ? service.warranty_days || 0 : 0);
    }

    const updated = await Booking.update(booking.id, patch, { expectedStatus: booking.status });

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Trạng thái đơn vừa được cập nhật bởi quản trị viên hoặc đã thay đổi. Vui lòng tải lại.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã cập nhật tiến độ công việc: "${STATUS_LABELS[newStatus]}".`,
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableJobs,
  claimJob,
  getMyJobs,
  updateJobStatus,
};
