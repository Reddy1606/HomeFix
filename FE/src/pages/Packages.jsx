import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { fetchPackages, fetchMySubscription, subscribePackage } from '../api/packages';
import { formatPrice } from '../api/services';

export default function Packages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const pkgs = await fetchPackages();
      setPackages(pkgs);

      if (user && user.role === 'customer') {
        const subData = await fetchMySubscription();
        if (subData?.has_subscription) {
          setActiveSub(subData.subscription);
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu gói:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenSubscribe = (pkg) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/packages')}`);
      return;
    }
    if (user.role === 'technician') {
      alert('Tài khoản thợ không thể đăng ký gói dịch vụ gia đình. Vui lòng sử dụng tài khoản khách hàng.');
      return;
    }
    setSelectedPkg(pkg);
    setErrorMsg('');
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPkg) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await subscribePackage(selectedPkg.id, 'bank_transfer');
      setSelectedPkg(null);
      setSuccessModal({
        packageName: selectedPkg.name,
        badge: selectedPkg.badge,
        expiry: res.data?.subscription?.end_date,
      });
      // Tải lại trạng thái subscription
      const subData = await fetchMySubscription();
      if (subData?.has_subscription) {
        setActiveSub(subData.subscription);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể đăng ký gói. Vui lòng thử lại sau.');
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

  return (
    <main className="min-h-screen bg-gray-50/60 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-200 backdrop-blur">
            ✨ Đề án Khởi nghiệp HomeFix Care • Siêu Tiết Kiệm
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Gói Chăm Sóc Nhà Cửa Trọn Gói
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-brand-100 sm:text-lg">
            Đơn của bạn <strong>luôn được thợ nhận sớm nhất</strong>, miễn phí bảo dưỡng định kỳ và bảo hành chính hãng HomeFix lên đến 90 ngày.
          </p>

          {/* 3 GIÁ TRỊ VÀNG */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-2xl">
                ⚡
              </div>
              <h3 className="mt-3 font-bold text-white">Đơn Nhận Sớm Nhất</h3>
              <p className="mt-1 text-xs text-brand-100">
                Gắn cờ Ưu tiên VIP, hệ thống tự động đẩy đơn lên đầu danh sách thợ Top 4.8★+ nhận trong 10-15 phút.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/20 text-2xl">
                ❄️
              </div>
              <h3 className="mt-3 font-bold text-white">Bảo Dưỡng Miễn Phí</h3>
              <p className="mt-1 text-xs text-brand-100">
                Bao gồm 1 - 4 lần vệ sinh máy lạnh, thiết bị gia dụng trọn gói (trị giá lên đến 800.000đ).
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-2xl">
                🛡️
              </div>
              <h3 className="mt-3 font-bold text-white">Bảo Hành HomeFix 90 Ngày</h3>
              <p className="mt-1 text-xs text-brand-100">
                HomeFix trực tiếp bảo chứng chất lượng, thợ quay lại sửa miễn phí 100% nếu tái phát lỗi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER GÓI ĐANG HOẠT ĐỘNG (NẾU ĐÃ MUA) */}
      {activeSub && (
        <div className="mx-auto -mt-6 max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 text-white shadow-xl shadow-amber-500/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner">
                  👑
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                      Gói Hội Viên Đang Kích Hoạt
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-amber-800">
                      ACTIVE
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white sm:text-2xl">
                    {activeSub.package_name}
                  </h2>
                  <p className="text-xs text-amber-100">
                    Thời hạn: đến ngày <strong>{formatDate(activeSub.end_date)}</strong> • Bảo hành công việc: <strong>{activeSub.warranty_days} ngày</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-black/20 px-4 py-2 text-center backdrop-blur">
                  <div className="text-xs text-amber-200">Lượt bảo dưỡng còn lại</div>
                  <div className="text-xl font-extrabold text-white">
                    {activeSub.remaining_quota} lần
                  </div>
                </div>
                <Link
                  to="/booking"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-amber-800 shadow-md hover:bg-amber-50 transition"
                >
                  ⚡ Đặt lịch Ưu tiên ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH CÁC GÓI */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            Bảng Giá Gói Dịch Vụ Định Kỳ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Mức giá khởi nghiệp siêu tiết kiệm, minh bạch, chỉ từ <strong>25.000 đ/tháng</strong>
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Đang tải danh sách gói dịch vụ...</div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {packages.map((pkg) => {
              const isCurrent = activeSub && (activeSub.package_id === pkg.id || activeSub.package_name === pkg.name);
              const isPopular = pkg.code === 'standard_1y';
              const isVip = pkg.code === 'vip_1y';

              return (
                <div
                  key={pkg.id || pkg.code}
                  className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 ${
                    isPopular
                      ? 'border-2 border-brand-500 bg-white shadow-xl shadow-brand-500/10 ring-4 ring-brand-500/10 lg:-translate-y-2'
                      : isVip
                      ? 'border-2 border-purple-400 bg-gradient-to-b from-white to-purple-50/40 shadow-lg'
                      : 'border border-gray-200 bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* BADGE */}
                  {pkg.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-black shadow-sm ${
                          isPopular
                            ? 'bg-brand-600 text-white'
                            : isVip
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* TIÊU ĐỀ & MÔ TẢ */}
                    <div className="mt-2">
                      <h3 className="text-xl font-black text-gray-900">{pkg.name}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">{pkg.description}</p>
                    </div>

                    {/* GIÁ CẢ */}
                    <div className="mt-6 border-b border-gray-100 pb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black tracking-tight text-gray-900">
                          {formatPrice(pkg.price)}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">
                          / {pkg.duration_months} tháng
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-emerald-600">
                        Chỉ ~{formatPrice(Math.round(pkg.price / pkg.duration_months))}/tháng
                      </div>
                    </div>

                    {/* DANH SÁCH QUYỀN LỢI */}
                    <ul className="mt-6 space-y-3.5 text-xs text-gray-700">
                      {Array.isArray(pkg.features) &&
                        pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                              ✓
                            </span>
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* NÚT ĐĂNG KÝ */}
                  <div className="mt-8 pt-4">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500 cursor-not-allowed border border-gray-200"
                      >
                        ✓ Gói đang kích hoạt
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSubscribe(pkg)}
                        className={`w-full rounded-xl py-3 text-sm font-bold transition shadow-sm ${
                          isPopular
                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/30'
                            : isVip
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/30'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        Đăng ký gói này →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL XÁC NHẬN MUA GÓI */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Xác nhận đăng ký gói dịch vụ</h3>
              <button
                onClick={() => setSelectedPkg(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                <div className="text-xs font-semibold text-brand-700">Gói bạn chọn:</div>
                <div className="text-base font-extrabold text-brand-900">{selectedPkg.name}</div>
                <div className="mt-2 text-2xl font-black text-brand-700">
                  {formatPrice(selectedPkg.price)}
                </div>
                <div className="text-xs text-brand-600 mt-0.5">
                  Thời hạn: {selectedPkg.duration_months} tháng • {selectedPkg.maintenance_quota} lần bảo dưỡng miễn phí
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-600 space-y-1">
                <div>⚡ <strong>Đơn luôn được nhận sớm:</strong> Tự động gắn cờ Ưu tiên VIP cho toàn bộ đơn đặt trong {selectedPkg.duration_months} tháng tới.</div>
                <div>🛡️ <strong>Bảo hành chính hãng:</strong> Thời hạn bảo hành công việc mở rộng lên đến <strong>{selectedPkg.warranty_days} ngày</strong>.</div>
                <div>🎁 <strong>Ưu đãi:</strong> Giảm {selectedPkg.discount_percentage}% tiền công cho mọi ca sửa chữa phát sinh.</div>
              </div>

              {errorMsg && (
                <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPkg(null)}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubscribe}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
                >
                  {submitting ? 'Đang kích hoạt...' : 'Kích hoạt ngay ⚡'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÀNH CÔNG */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              🎉
            </div>
            <h3 className="mt-4 text-xl font-black text-gray-900">
              Chúc mừng bạn đã nâng cấp VIP!
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Bạn đã đăng ký thành công <strong>{successModal.packageName}</strong>. Toàn bộ đơn đặt lịch của bạn từ bây giờ sẽ được thợ nhận việc sớm nhất và hưởng trọn vẹn đặc quyền bảo hành HomeFix.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/booking"
                onClick={() => setSuccessModal(null)}
                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 transition"
              >
                ⚡ Trải nghiệm Đặt lịch Ưu tiên ngay
              </Link>
              <button
                type="button"
                onClick={() => setSuccessModal(null)}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
