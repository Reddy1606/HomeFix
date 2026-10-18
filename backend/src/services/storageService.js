const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { supabase } = require('../config/database');
const config = require('../config/env');

const BUCKET_NAME = 'homefix-media';

/**
 * Đảm bảo thư mục lưu trữ cục bộ tồn tại khi cần fallback
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Tải file lên Supabase Storage (kèm cơ chế Fallback lưu cục bộ nếu Bucket chưa cấu hình)
 * @param {Object} params
 * @param {Buffer} params.buffer - Nội dung file
 * @param {string} params.originalname - Tên file gốc
 * @param {string} params.mimetype - Định dạng file
 * @param {string} [params.folder='general'] - Thư mục phân loại (avatars, kyc, services)
 * @returns {Promise<{ url: string, storage: 'supabase' | 'local', path: string }>}
 */
async function uploadFile({ buffer, originalname, mimetype, folder = 'general' }) {
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const storagePath = `${folder}/${uniqueName}`;

  // 1. Thử tải lên Supabase Storage với timeout 6s (nếu mạng quốc tế chậm, tự động fallback lưu local)
  try {
    const supabaseUploadPromise = supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase storage upload timeout (vượt quá 6s)')), 6000)
    );

    const { data, error } = await Promise.race([supabaseUploadPromise, timeoutPromise]);

    if (!error && data) {
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      if (publicData?.publicUrl) {
        return {
          url: publicData.publicUrl,
          storage: 'supabase',
          path: storagePath,
        };
      }
    }
  } catch (err) {
    console.warn(`[StorageService] Supabase upload skipped/failed (${err.message}), falling back to local storage.`);
  }

  // 2. Cơ chế Fallback: Lưu vào thư mục public/uploads trên máy
  try {
    const localUploadsDir = path.join(__dirname, '../../public/uploads', folder);
    ensureDir(localUploadsDir);

    const localFilePath = path.join(localUploadsDir, uniqueName);
    fs.writeFileSync(localFilePath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${config.port || 5000}`;
    const fileUrl = `${baseUrl}/uploads/${folder}/${uniqueName}`;

    return {
      url: fileUrl,
      storage: 'local',
      path: `uploads/${folder}/${uniqueName}`,
    };
  } catch (localErr) {
    throw new Error(`Không thể lưu tệp: ${localErr.message}`);
  }
}

module.exports = {
  uploadFile,
  BUCKET_NAME,
};
