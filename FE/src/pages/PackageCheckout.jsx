import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/ToastContext';
import { fetchPackages, subscribePackage, fetchMySubscription } from '../api/packages';
import { formatPrice } from '../api/services';

export default function PackageCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const pkgId = searchParams.get('pkgId') || searchParams.get('pkg') || '';

  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer'); // 'bank_transfer' | 'momo' | 'cod'
  const [countdown, setCountdown] = useState(600); // 10 phút đếm ngược
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Tải thông tin gói
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const list = await fetchPackages();
        if (!isMounted) return;
        setPackages(list);

        // Tìm gói theo id hoặc code
        let target = list.find((p) => p.id === pkgId || p.code === pkgId);
        if (!target && list.length > 0) {
          // Mặc định chọn gói Standard nếu không tìm thấy
          target = list.find((p) => p.code === 'standard_1y') || list[0];
        }
        setSelectedPkg(target);
      } catch (err) {
        console.error('Lỗi tải gói thanh toán:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [pkgId]);

  // Bộ đếm ngược 10 phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sao chép nội dung
  const handleCopy = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Xác nhận thanh toán & kích hoạt VIP
  const handleConfirmPayment = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (user.role === 'technician') {
      showToast('Tài khoản thợ không thể đăng ký gói dịch vụ khách hàng.', 'error');
      return;
    }
    if (!selectedPkg) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await subscribePackage(selectedPkg.id, paymentMethod);
      const sub = res.data?.subscription;

      // Cập nhật context user thành VIP ngay lập tức
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          is_vip: true,
          subscription: sub,
        }));
      }

      setSuccessData({
        packageName: selectedPkg.name,
        badge: selectedPkg.badge,
        expiry: sub?.end_date,
        quota: sub?.remaining_quota || selectedPkg.maintenance_quota,
        warrantyDays: selectedPkg.warranty_days,
        discount: selectedPkg.discount_percentage,
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  // Chuỗi mã chuyển khoản tự động
  const transferContent = selectedPkg
    ? `HFVIP ${selectedPkg.code.toUpperCase()} ${user?.phone ? user.phone.slice(-4) : user?.id?.slice(0, 4) || 'VIP'}`
    : '';

  // Link VietQR chuẩn Napas 247
  const vietQrUrl = selectedPkg
    ? `https://api.vietqr.io/image/970422-0908889999-compact2.jpg?amount=${selectedPkg.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=CONG%20TY%20CONG%20NGHE%20HOMEFIX`
    : '';

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-2xl">⏳</span>
          <span>Đang chuẩn bị trang thanh toán...</span>
        </div>
      </main>
    );
  }

  // MÀN HÌNH CHÚC MỪNG VIP KHI THANH TOÁN THÀNH CÔNG
  if (successData) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-slate-900 py-16 px-4 text-white sm:py-24">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center text-gray-900 shadow-2xl animate-fade-in border border-amber-300">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-4xl shadow-lg shadow-amber-400/30">
            👑
          </div>

          <span className="mt-3 inline-block rounded-full bg-amber-100 px-3.5 py-1 text-xs font-black text-amber-800">
            {successData.badge || 'HỘI VIÊN VIP'}
          </span>

          <h1 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">
            Chúc mừng bạn đã là Hội viên VIP!
          </h1>
          <p className="mt-2 text-xs text-gray-600">
            Thanh toán thành công gói <strong>{successData.packageName}</strong>. Tài khoản của bạn đã được kích hoạt trọn bộ đặc quyền VIP HomeFix.
          </p>

          {/* THẺ VIP CARD HOÀNG KIM (LUXURY BLACK & GOLD) */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-6 text-left text-white shadow-xl border border-amber-400/60 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <span className="font-black text-xs tracking-wider text-amber-300 uppercase">
                  HOMEFIX VIP GOLD MEMBER
                </span>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            <div className="mt-4">
              <div className="text-[11px] text-gray-400">Chủ thẻ hội viên:</div>
              <div className="text-lg font-extrabold text-white">{user?.full_name || 'Khách hàng VIP'}</div>
              <div className="text-xs text-amber-300 font-semibold">{successData.packageName}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3">
              <div>
                <span className="text-gray-400 block text-[10px]">Lượt bảo dưỡng:</span>
                <strong className="text-amber-300 font-black text-sm">{successData.quota} lần miễn phí</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Thời hạn đến:</span>
                <strong className="text-white text-xs">{formatDate(successData.expiry)}</strong>
              </div>
            </div>
          </div>

          {/* CÁC ĐẶC QUYỀN ĐÃ KÍCH HOẠT */}
          <div className="mt-5 rounded-2xl bg-amber-50/80 p-4 text-left text-xs text-amber-950 space-y-2 border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span><strong>Đơn ưu tiên số 1:</strong> Khi bạn đặt lịch, hệ thống tự động đẩy đơn lên đầu sàn việc để thợ nhận trong 10-15 phút.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">❄️</span>
              <span><strong>Bảo dưỡng định kỳ:</strong> Được trừ 100% chi phí cho các lượt vệ sinh điều hòa, thiết bị.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span><strong>Bảo hành {successData.warrantyDays} ngày:</strong> Cam kết thợ xử lý miễn phí nếu tái phát lỗi.</span>
            </div>
          </div>

          {/* NÚT ĐIỀU HƯỚNG */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/booking"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 hover:scale-102 transition text-center"
            >
              ⚡ Trải nghiệm Đặt lịch Ưu tiên ngay
            </Link>
            <Link
              to="/profile"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition text-center"
            >
              👤 Xem Thẻ VIP trên Trang cá nhân
            </Link>
            <Link
              to="/"
              className="py-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Về Trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/80 pb-20 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
          <span>/</span>
          <Link to="/packages" className="hover:text-brand-600">Gói dịch vụ</Link>
          <span>/</span>
          <span className="font-bold text-gray-900">Thanh toán đăng ký gói</span>
        </div>

        {/* TIÊU ĐỀ TRANG THANH TOÁN */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-extrabold text-brand-800">
              BƯỚC THANH TOÁN & KÍCH HOẠT
            </span>
            <span className="text-xs text-gray-500">
              ⏱️ Đơn giữ chỗ trong <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</strong>
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
            Thanh Toán Gói Dịch Vụ HomeFix
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            Vui lòng kiểm tra lại thông tin gói, chọn hình thức thanh toán và quét mã để kích hoạt đặc quyền VIP.
          </p>
        </div>

        {/* LAYOUT CHÍNH 2 CỘT CHUẨN CHECKOUT */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* CỘT TRÁI (7 CỘT): PHƯƠNG THỨC THANH TOÁN & MÃ QR */}
          <div className="space-y-6 lg:col-span-7">
            {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <span>1. Thông tin người đăng ký</span>
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-gray-700">
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-gray-500 block text-[11px]">Họ và tên:</span>
                  <strong className="text-gray-900 text-sm">{user?.full_name || 'Khách hàng'}</strong>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <span className="text-gray-500 block text-[11px]">Số điện thoại:</span>
                  <strong className="text-gray-900 text-sm">{user?.phone || 'Chưa cập nhật'}</strong>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 sm:col-span-2">
                  <span className="text-gray-500 block text-[11px]">Email nhận hóa đơn & bảo hành:</span>
                  <strong className="text-gray-900">{user?.email || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* KHỐI 2: CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <span>2. Chọn phương thức thanh toán</span>
              </h2>

              <div className="mt-4 space-y-3">
                {/* VietQR */}
                <label
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                      🏦
                    </span>
                    <div>
                      <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                        <span>Chuyển khoản VietQR Ngân hàng</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">Khuyên dùng</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Quét mã QR qua app mọi ngân hàng (MB, Vietcombank, Techcombank, BIDV...).
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="h-4 w-4 text-brand-600"
                  />
                </label>

                {/* MoMo */}
                <label
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === 'momo'
                      ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-2xl">
                      📱
                    </span>
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">Ví điện tử MoMo</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Quét mã MoMo hoặc chuyển trực tiếp đến ví HomeFix.
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                    className="h-4 w-4 text-pink-600"
                  />
                </label>

                {/* COD / Trả sau */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                      💵
                    </span>
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">Thanh toán khi thợ tới bảo dưỡng (COD)</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Kích hoạt VIP ngay, thanh toán tiền mặt/chuyển khoản cho thợ ở ca làm đầu tiên.
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="h-4 w-4 text-amber-600"
                  />
                </label>
              </div>
            </div>

            {/* KHỐI 3: MÀN HÌNH QUÉT MÃ QR & CHI TIẾT CHUYỂN KHOẢN */}
            {selectedPkg && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <span>3. Hướng dẫn thanh toán & Thông tin chuyển khoản</span>
                </h2>

                {paymentMethod === 'bank_transfer' ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Mã QR */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-center">
                      <img
                        src={vietQrUrl}
                        alt="VietQR HomeFix"
                        className="h-52 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-md"
                      />
                      <div className="mt-2 text-[11px] font-bold text-gray-600">
                        Quét mã bằng App Ngân Hàng bất kỳ
                      </div>
                      <div className="text-[10px] text-gray-400">
                        MB, VCB, Techcombank, VPBank, TPBank...
                      </div>
                    </div>

                    {/* Chi tiết tài khoản nhận */}
                    <div className="md:col-span-7 space-y-2.5 text-xs text-gray-700">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-gray-500">Ngân hàng thụ hưởng:</span>
                        <strong className="text-gray-900 font-bold">MB Bank (Quân Đội)</strong>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-gray-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-base font-black text-gray-900">0908889999</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy('0908889999', 'stk')}
                            className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-gray-200 transition"
                          >
                            {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-gray-500">Chủ tài khoản:</span>
                        <strong className="text-gray-900 font-bold">CONG TY CONG NGHE HOMEFIX</strong>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-gray-500">Số tiền:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-brand-700 text-base font-black">
                            {formatPrice(selectedPkg.price)}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(selectedPkg.price), 'price')}
                            className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-gray-200 transition"
                          >
                            {copiedField === 'price' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-500">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-brand-700 font-mono font-bold">{transferContent}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopy(transferContent, 'content')}
                            className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-100 transition"
                          >
                            {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : paymentMethod === 'momo' ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-pink-200 bg-pink-50/50 p-6 text-center">
                    <img
                      src={`https://api.vietqr.io/image/970422-0908889999-compact2.jpg?amount=${selectedPkg.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=CONG%20TY%20CONG%20NGHE%20HOMEFIX`}
                      alt="MoMo HomeFix"
                      className="h-52 w-52 rounded-xl border border-pink-200 bg-white p-2 shadow-md"
                    />
                    <div className="mt-3 text-sm font-bold text-pink-900">
                      Số Ví MoMo: <span className="font-mono text-base">0908889999</span> (HOMEFIX CARE)
                    </div>
                    <div className="mt-1 text-xs text-pink-700">
                      Nội dung: <strong>{transferContent}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                    <div className="font-bold text-sm">💵 Thanh toán khi thợ đến nhà (COD):</div>
                    <p>
                      Đặc quyền VIP của bạn sẽ được kích hoạt <strong>ngay lập tức</strong> trên hệ thống để thợ nhận đơn ưu tiên nhất.
                    </p>
                    <p>
                      Bạn chỉ cần thanh toán số tiền <strong>{formatPrice(selectedPkg.price)}</strong> trực tiếp cho thợ sửa chữa khi thợ đến thực hiện ca bảo dưỡng đầu tiên.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN HÀNG & NÚT XÁC NHẬN (STICKY) */}
          <div className="space-y-6 lg:col-span-5">
            {selectedPkg && (
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TÓM TẮT ĐƠN HÀNG</span>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-black text-brand-800">
                    {selectedPkg.badge || 'GÓI CHĂM SÓC'}
                  </span>
                </div>

                {/* THÔNG TIN GÓI */}
                <div className="mt-4">
                  <h3 className="text-base font-black text-gray-900">{selectedPkg.name}</h3>
                  <div className="mt-1 text-xs text-gray-500">
                    Thời hạn: <strong>{selectedPkg.duration_months} tháng</strong> • <strong>{selectedPkg.maintenance_quota} lần bảo dưỡng miễn phí</strong>
                  </div>
                </div>

                {/* ĐẶC QUYỀN VIP KÈM THEO */}
                <div className="mt-4 rounded-xl bg-amber-50/60 p-3.5 border border-amber-100 text-xs text-amber-950 space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>Đặc quyền kích hoạt ngay:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Hàng đợi ưu tiên VIP (Thợ nhận đơn trong 10-15 phút)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{selectedPkg.maintenance_quota} lần bảo dưỡng miễn phí (trị giá {formatPrice(selectedPkg.price)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Bảo hành chất lượng công việc {selectedPkg.warranty_days} ngày</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Giảm {selectedPkg.discount_percentage}% tiền công mọi ca sửa chữa</span>
                  </div>
                </div>

                {/* BẢNG TÍNH TIỀN */}
                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Giá trị thực tế:</span>
                    <span className="line-through">{formatPrice(selectedPkg.price * 1.35)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Hỗ trợ khởi nghiệp:</span>
                    <span>- {formatPrice(selectedPkg.price * 0.35)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                    <strong className="text-xl font-black text-brand-700">
                      {formatPrice(selectedPkg.price)}
                    </strong>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    {errorMsg}
                  </div>
                )}

                {/* NÚT HÀNH ĐỘNG CHÍNH */}
                <div className="mt-6 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={submitting}
                    className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-extrabold text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Đang kích hoạt gói VIP...' : '⚡ XÁC NHẬN ĐÃ THANH TOÁN & KÍCH HOẠT'}
                  </button>

                  {/* NÚT MÔ PHỎNG TEST NHANH */}
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={submitting}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🧪 Mô phỏng thanh toán thành công (Thử nghiệm nhanh)</span>
                  </button>

                  <Link
                    to="/packages"
                    className="block text-center py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    ← Đổi sang gói dịch vụ khác
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
