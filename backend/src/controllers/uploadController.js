const User = require('../models/User');
const { uploadFile } = require('../services/storageService');

/**
 * @desc    Upload ảnh đại diện (Avatar) cho người dùng hiện tại
 * @route   POST /api/upload/avatar
 * @access  Private (Mọi user đã đăng nhập)
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tệp hình ảnh để tải lên.',
      });
    }

    const uploadResult = await uploadFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      folder: 'avatars',
    });

    const updatedUser = await User.update(req.user.id, {
      avatar_url: uploadResult.url,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công!',
      data: {
        avatar_url: uploadResult.url,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload tài liệu KYC xác minh thợ (CCCD gắn chip / Lý lịch tư pháp / Chứng chỉ nghề)
 * @route   POST /api/upload/kyc
 * @access  Private (Chỉ thợ - technician)
 */
const uploadKYC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tệp tài liệu để tải lên.',
      });
    }

    const { type, cccd_number } = req.body;
    const documentType = type || 'cccd'; // 'cccd' hoặc 'certificate'

    const uploadResult = await uploadFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      folder: 'kyc',
    });

    const patchData = {};
    if (documentType === 'cccd') {
      patchData.cccd_image = uploadResult.url;
      if (cccd_number) {
        patchData.cccd_number = cccd_number.trim();
      }
    } else {
      patchData.criminal_record_url = uploadResult.url;
    }

    const updatedUser = await User.update(req.user.id, patchData);

    res.status(200).json({
      success: true,
      message: 'Tải lên tài liệu xác minh KYC thành công! Hồ sơ sẽ được Admin phê duyệt.',
      data: {
        document_url: uploadResult.url,
        type: documentType,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload ảnh minh họa dịch vụ sửa chữa
 * @route   POST /api/upload/service-image
 * @access  Private (Chỉ Admin)
 */
const uploadServiceImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn hình ảnh dịch vụ.',
      });
    }

    const uploadResult = await uploadFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      folder: 'services',
    });

    res.status(200).json({
      success: true,
      message: 'Tải lên hình ảnh dịch vụ thành công!',
      data: {
        image_url: uploadResult.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAvatar,
  uploadKYC,
  uploadServiceImage,
};
