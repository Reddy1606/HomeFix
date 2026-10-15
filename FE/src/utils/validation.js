export const isVietnamesePhone = (value) => /^0[35789]\d{8}$/.test(value);
export const isStrongPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
export const passwordHint = 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.';

export function validateProfile(values) {
  const errors = {};
  if (
    values.full_name.trim().length < 2 ||
    values.full_name.trim().length > 100
  )
    errors.full_name = 'Họ tên phải có từ 2 đến 100 ký tự.';
  if (!isVietnamesePhone(values.phone.trim()))
    errors.phone =
      'Nhập số điện thoại 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
  if ((values.address || '').trim().length > 500)
    errors.address = 'Địa chỉ tối đa 500 ký tự.';
  return errors;
}

// Chỉ quay về đường dẫn trong ứng dụng; không nhận URL ngoài hoặc route xác thực.
export function safeReturnTo(value) {
  const path =
    typeof value === 'string'
      ? value
      : value?.pathname
        ? `${value.pathname}${value.search || ''}${value.hash || ''}`
        : '';
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\\r\n]/.test(path) ||
    /^\/(login|register)([/?#]|$)/.test(path)
  )
    return null;
  return path;
}

export function apiError(error) {
  if (!error.response)
    return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  return (
    error.response.data?.message ||
    'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
  );
}
export function fieldErrors(error) {
  return Object.fromEntries(
    (error.response?.data?.errors || []).map((item) => [
      item.field,
      item.message,
    ])
  );
}
