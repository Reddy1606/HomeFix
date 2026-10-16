const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { toRangeBoundary, vnDateString } = require('../utils/date');
const { ADMIN_TRANSITIONS, STATUS_LABELS, canTransition } = require('../utils/bookingStatus');

/**
 * @desc    Danh sách tất cả đơn đặt lịch (lọc theo trạng thái, khách, thợ, loại đơn, ngày tạo)
 * @route   GET /api/admin/bookings?status=&customer_id=&technician_id=&booking_type=&from=&to=&page=&limit=
 * @access  Private (admin)
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const q = req.query;

    const from = q.from ? toRangeBoundary(q.from, 'start') : null;
    const to = q.to ? toRangeBoundary(q.to, 'end') : null;

    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: [{ field: 'from', message: 'from không được sau to.' }],
      });
    }

    const { bookings, total } = await Booking.findAll({
      status: q.status || null,
      customerId: q.customer_id || null,
      technicianId: q.technician_id || null,
      bookingType: q.booking_type || null,
      from,
      to,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn đặt lịch thành công.',
      data: { bookings, pagination: buildPagination({ page, limit, total }) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chi tiết một đơn (kèm thông tin khách hàng và thợ)
 * @route   GET /api/admin/bookings/:id
 * @access  Private (admin)
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id, { withUsers: true });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt lịch.' });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn đặt lịch thành công.',
      data: {
        booking,
        // Các trạng thái admin có thể chuyển tiếp, để Frontend hiển thị đúng nút bấm
        allowed_next_statuses: ADMIN_TRANSITIONS[booking.status] || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái đơn (có thể kèm gán thợ)
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Private (admin)
 *
 * Body: { status, technician_id? }
 * - Chỉ cho phép các bước chuyển hợp lệ (xem utils/bookingStatus.js)
 * - Khi hoàn thành lần đầu: tự tính warranty_until = hôm nay + warranty_days của dịch vụ
 * - Chỉ nhận bảo hành (warranty_claim) khi còn trong thời hạn bảo hành
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const newStatus = req.body.status;
    const technicianId = req.body.technician_id;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt lịch.' });
    }

    if (booking.status === newStatus) {
      return res.status(400).json({
        success: false,
        message: `Đơn đã ở trạng thái "${STATUS_LABELS[newStatus]}".`,
      });
    }

    if (!canTransition(booking.status, newStatus)) {
      const allowed = (ADMIN_TRANSITIONS[booking.status] || []).map((s) => `"${s}"`).join(', ');
      return res.status(400).json({
        success: false,
        message:
          `Không thể chuyển đơn từ "${STATUS_LABELS[booking.status]}" sang "${STATUS_LABELS[newStatus]}".` +
          (allowed ? ` Trạng thái hợp lệ tiếp theo: ${allowed}.` : ' Đơn đã kết thúc, không thể đổi trạng thái.'),
      });
    }

    const patch = { status: newStatus };

    // Gán thợ (nếu có)
    if (technicianId !== undefined) {
      if (newStatus === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Không thể gán thợ khi hủy đơn.',
        });
      }
      const technician = await User.findById(technicianId);
      if (!technician || technician.role !== 'technician' || !technician.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Thợ không tồn tại hoặc không hoạt động.',
          errors: [{ field: 'technician_id', message: 'technician_id phải là tài khoản thợ (technician) đang hoạt động.' }],
        });
      }
      if (!technician.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Thợ chưa được xác minh (KYC). Hãy xác minh thợ trước khi gán đơn.',
        });
      }
      patch.technician_id = technician.id;
    }

    // Bảo hành: chỉ nhận khi còn hạn
    if (newStatus === 'warranty_claim') {
      if (!booking.warranty_until || vnDateString() > booking.warranty_until) {
        return res.status(400).json({
          success: false,
          message: 'Đơn đã hết thời hạn bảo hành, không thể tạo yêu cầu bảo hành.',
        });
      }
    }

    // Hoàn thành lần đầu: tính hạn bảo hành (không gia hạn lại sau khi bảo hành xong)
    if (newStatus === 'completed' && !booking.warranty_until) {
      const service = await Service.findById(booking.service_id);
      patch.warranty_until = vnDateString(service ? service.warranty_days || 0 : 0);
    }

    const updated = await Booking.update(booking.id, patch, { expectedStatus: booking.status });

    // Có người khác vừa đổi trạng thái đơn này
    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Trạng thái đơn vừa được cập nhật bởi người khác. Vui lòng tải lại và thử lại.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn: ${STATUS_LABELS[newStatus]}.`,
      data: {
        booking: updated,
        allowed_next_statuses: ADMIN_TRANSITIONS[updated.status] || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thống kê tổng quan cho Admin Dashboard (bao gồm doanh thu & hoa hồng 15%)
 * @route   GET /api/admin/dashboard
 * @access  Private (admin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Thống kê tổng số đơn, phân bố trạng thái, tổng doanh thu & hoa hồng 15%
    const stats = await Booking.getRevenueAndStatusStats();

    // 2. Tổng số dịch vụ đang có trên hệ thống
    const { total: total_services } = await Service.findAll({ limit: 1, includeInactive: true });

    // 3. Lấy 5 đơn đặt lịch gần đây nhất
    const { bookings: recent_bookings } = await Booking.findAll({ limit: 5 });

    res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu dashboard thành công.',
      data: {
        total_bookings: stats.total_bookings,
        pending_bookings: stats.pending_bookings,
        completed_bookings: stats.completed_bookings,
        total_services,
        status_counts: stats.status_counts,
        revenue: stats.revenue,
        recent_bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBookings, getBookingById, updateBookingStatus, getDashboardStats };
