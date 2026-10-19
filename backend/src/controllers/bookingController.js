const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { CUSTOMER_CANCELLABLE, STATUS_LABELS } = require('../utils/bookingStatus');

/**
 * Thêm cờ can_cancel và can_review để Frontend dễ dàng render giao diện
 */
const withFlags = (booking) => {
  const hasReview = Array.isArray(booking.reviews) ? booking.reviews.length > 0 : !!booking.reviews;
  return {
    ...booking,
    can_cancel: CUSTOMER_CANCELLABLE.includes(booking.status),
    can_review: booking.status === 'completed' && !hasReview,
  };
};

/**
 * @desc    Tạo đơn đặt lịch sửa chữa
 * @route   POST /api/bookings
 * @access  Private (customer)
 *
 * Body: { service_id, booking_type?, scheduled_at?, address, description?, use_maintenance_quota? }
 * Giá (total_price), trạng thái và customer_id do server quyết định,
 * không nhận từ client.
 */
const createBooking = async (req, res, next) => {
  try {
    const { service_id, address, description, use_maintenance_quota } = req.body;
    const bookingType = req.body.booking_type || 'immediate';

    const service = await Service.findById(service_id);
    if (!service || !service.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại hoặc đã ngừng cung cấp.',
      });
    }

    // Kiểm tra xem khách có gói VIP / Bảo dưỡng đang hoạt động không
    const activeSub = await Subscription.findActiveByUserId(req.user.id);
    let isPriority = false;
    let priorityLevel = 0;
    let totalPrice = Number(service.base_price);
    let finalDescription = description ? description.trim() : '';
    let subscriptionId = null;

    if (activeSub) {
      isPriority = true;
      priorityLevel = activeSub.priority_level || 1;
      subscriptionId = activeSub.id;

      if (use_maintenance_quota === true && activeSub.remaining_quota > 0) {
        totalPrice = 0;
        finalDescription = `[ĐÃ DÙNG 1 LẦN BẢO DƯỠNG THEO GÓI] ${finalDescription}`.trim();
        await Subscription.useQuota(activeSub.id);
      } else if (activeSub.discount_percentage > 0) {
        totalPrice = Math.round(totalPrice * (1 - activeSub.discount_percentage / 100));
      }

      finalDescription = `[⚡ ĐƠN VIP ƯU TIÊN NHẬN SỚM] ${finalDescription}`.trim();
    }

    const booking = await Booking.create({
      customer_id: req.user.id,
      service_id: service.id,
      status: 'pending',
      booking_type: bookingType,
      scheduled_at: bookingType === 'scheduled' ? new Date(req.body.scheduled_at).toISOString() : null,
      address,
      description: finalDescription || null,
      total_price: totalPrice,
      is_priority: isPriority,
      priority_level: priorityLevel,
      subscription_id: subscriptionId,
    });

    res.status(201).json({
      success: true,
      message: isPriority
        ? '⚡ Đặt lịch thành công! Đơn của bạn được xếp vào hàng đợi Ưu tiên VIP và thợ sẽ nhận việc sớm nhất.'
        : 'Đặt lịch thành công! HomeFix sẽ sớm điều phối thợ cho bạn.',
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

/**
 * @desc    Đánh giá & phản hồi đơn hàng (chỉ khách hàng được đánh giá khi đơn completed)
 * @route   POST /api/bookings/:id/review
 * @access  Private (customer)
 */
const createReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const booking = await Booking.findById(id, { withUsers: true });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt lịch.',
      });
    }

    // Chỉ khách hàng sở hữu đơn mới được đánh giá
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá đơn đặt lịch này.',
      });
    }

    // Chỉ được đánh giá khi đơn đã hoàn thành (completed)
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh giá đơn hàng khi đơn đã hoàn thành (completed).',
      });
    }

    // Kiểm tra xem đơn đã được đánh giá trước đó chưa (tránh spam đánh giá 2 lần)
    const existingReview = await Review.findByBookingId(id);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này đã được đánh giá rồi.',
      });
    }

    // Tạo review mới
    const review = await Review.create({
      booking_id: id,
      rating: parseInt(rating, 10),
      comment: comment ? comment.trim() : null,
    });

    // Cập nhật điểm uy tín và số lượng đánh giá cho thợ (nếu đơn có thợ phụ trách)
    if (booking.technician_id) {
      try {
        await User.updateTechnicianRating(booking.technician_id, review.rating);
      } catch (err) {
        console.warn('⚠️ Lỗi khi cập nhật rating thợ:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đánh giá đơn hàng thành công! Cảm ơn phản hồi của bạn.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, createReview };
