import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isVietnamesePhone,
  isStrongPassword,
  safeReturnTo,
  validateProfile,
} from '../src/utils/validation.js';

test('Số điện thoại: đúng 10 số và đầu số Việt Nam hợp lệ', () => {
  for (const phone of [
    '0301234567',
    '0501234567',
    '0701234567',
    '0801234567',
    '0901234567',
  ])
    assert.equal(isVietnamesePhone(phone), true);
  for (const phone of [
    '0201234567',
    '0601234567',
    '090123456',
    '09012345678',
    '0|01234567',
    '+84901234567',
    '090abc4567',
  ])
    assert.equal(isVietnamesePhone(phone), false);
});
test('Mật khẩu khớp yêu cầu backend', () => {
  assert.equal(isStrongPassword('Password1'), true);
  for (const password of ['password1', 'PASSWORD1', 'Password', 'Pass1', ''])
    assert.equal(isStrongPassword(password), false);
});
test('Không chuyển hướng sang website ngoài sau đăng nhập', () => {
  for (const url of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/login',
    '/register?redirect=/admin',
  ])
    assert.equal(safeReturnTo(url), null);
  assert.equal(
    safeReturnTo({
      pathname: '/booking',
      search: '?serviceId=123',
      hash: '#form',
    }),
    '/booking?serviceId=123#form'
  );
});
test('Hồ sơ: kiểm tra họ tên, số điện thoại và độ dài địa chỉ', () => {
  assert.deepEqual(
    validateProfile({
      full_name: 'Nguyễn An',
      phone: '0901234567',
      address: '',
    }),
    {}
  );
  assert.deepEqual(
    Object.keys(
      validateProfile({
        full_name: ' ',
        phone: '123',
        address: 'a'.repeat(501),
      })
    ).sort(),
    ['address', 'full_name', 'phone']
  );
});
