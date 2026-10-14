const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { CUSTOMER_CANCELLABLE, STATUS_LABELS } = require('../utils/bookingStatus');

/**
 * Thêm cờ can_cancel để Frontend biết có hiển thị nút "Hủy đơn" hay không
 */
const withFlags = (booking) => ({
  ...booking,
  can_cancel: CUSTOMER_CANCELLABLE.includes(booking.status),
});

/**
 * @desc    Tạo đơn đặt lịch sửa chữa
 * @route   POST /api/bookings
 * @access  Private (customer)
 *
 * Body: { service_id, booking_type?, scheduled_at?, address, description? }
 * Giá (total_price), trạng thái và customer_id do server quyết định,
 * không nhận từ client.
 */
const createBooking = async (req, res, next) => {
  try {
    const { service_id, address, description } = req.body;
    const bookingType = req.body.booking_type || 'immediate';

    const service = await Service.findById(service_id);
    if (!service || !service.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại hoặc đã ngừng cung cấp.',
      });
    }

    const booking = await Booking.create({
      customer_id: req.user.id,
      service_id: service.id,
      status: 'pending',
      booking_type: bookingType,
      scheduled_at: bookingType === 'scheduled' ? new Date(req.body.scheduled_at).toISOString() : null,
      address,
      description: description || null,
      total_price: service.base_price, // chốt giá tại thời điểm đặt
    });

    res.status(201).json({
      success: true,
      message: 'Đặt lịch thành công! HomeFix sẽ sớm điều phối thợ cho bạn.',
      data: { booking: withFlags(booking) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lịch sử đặt lịch của khách hàng đang đăng nhập
 * @route   GET /api/bookings/my?status=&page=&limit=
 * @access  Private (customer)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const status = req.query.status || null;

    const { bookings, total } = await Booking.findByCustomer(req.user.id, { status, page, limit });

    res.status(200).json({
      success: true,
      message: 'Lấy lịch sử đặt lịch thành công.',
      data: {
        bookings: bookings.map(withFlags),
        pagination: buildPagination({ page, limit, total }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chi tiết một đơn đặt lịch (khách xem đơn của mình, admin xem mọi đơn)
 * @route   GET /api/bookings/:id
 * @access  Private (customer, admin)
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id, { withUsers: true });

    // Trả 404 (thay vì 403) khi đơn của người khác để không lộ việc đơn có tồn tại
    const isOwner = booking && booking.customer_id === req.user.id;
    if (!booking || (!isOwner && req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt lịch.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn đặt lịch thành công.',
      data: { booking: withFlags(booking) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Khách hàng tự hủy đơn (chỉ khi đơn đang pending hoặc confirmed)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (customer)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.customer_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt lịch.',
      });
    }

    if (!CUSTOMER_CANCELLABLE.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn đang ở trạng thái "${STATUS_LABELS[booking.status]}".`,
      });
    }

    const updated = await Booking.update(
      booking.id,
      { status: 'cancelled' },
      { expectedStatus: booking.status }
    );

    // Trạng thái đơn vừa bị thay đổi bởi người khác (VD: admin vừa chuyển sang in_progress)
    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Trạng thái đơn vừa được cập nhật. Vui lòng tải lại và thử lại.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã hủy đơn đặt lịch.',
      data: { booking: withFlags(updated) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
