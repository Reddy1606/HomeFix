-- ================================================================
-- HomeFix - Migration: Gói Dịch Vụ & Thuê Bao Bảo Dưỡng (EXE101)
-- Bổ sung: service_packages, user_subscriptions, is_priority trên bookings
-- ================================================================

-- 1. BẢNG SERVICE_PACKAGES: Định nghĩa các gói bảo dưỡng & bảo hành
CREATE TABLE IF NOT EXISTS service_packages (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL, -- basic, standard, vip
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    price               DECIMAL(12, 0) NOT NULL,
    duration_months     INT NOT NULL DEFAULT 12,
    maintenance_quota   INT NOT NULL DEFAULT 2, -- Số lần bảo dưỡng miễn phí
    warranty_days       INT NOT NULL DEFAULT 60, -- Số ngày bảo hành dịch vụ
    priority_level      INT NOT NULL DEFAULT 1, -- 1: Ưu tiên, 2: Hỏa tốc VIP
    discount_percentage INT NOT NULL DEFAULT 10, -- % giảm giá tiền công phát sinh
    features            JSONB DEFAULT '[]'::jsonb, -- Danh sách các quyền lợi
    badge               VARCHAR(50) DEFAULT NULL, -- 'Phổ biến nhất', 'VIP Tiết kiệm'
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG USER_SUBSCRIPTIONS: Lưu gói mà khách hàng đã đăng ký
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id          UUID NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
    package_name        VARCHAR(150) NOT NULL,
    price_paid          DECIMAL(12, 0) NOT NULL,
    start_date          TIMESTAMPTZ DEFAULT NOW(),
    end_date            TIMESTAMPTZ NOT NULL,
    maintenance_quota   INT NOT NULL DEFAULT 0,
    remaining_quota     INT NOT NULL DEFAULT 0,
    priority_level      INT NOT NULL DEFAULT 1,
    warranty_days       INT NOT NULL DEFAULT 60,
    discount_percentage INT NOT NULL DEFAULT 10,
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'cancelled')),
    payment_method      VARCHAR(50) DEFAULT 'bank_transfer',
    payment_status      VARCHAR(20) DEFAULT 'paid'
                        CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CẬP NHẬT BẢNG BOOKINGS: Thêm cột gắn cờ ưu tiên nhận đơn & bảo hành
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_priority'
    ) THEN
        ALTER TABLE bookings ADD COLUMN is_priority BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'priority_level'
    ) THEN
        ALTER TABLE bookings ADD COLUMN priority_level INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_warranty_claim'
    ) THEN
        ALTER TABLE bookings ADD COLUMN is_warranty_claim BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'subscription_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. TẠO INDEXES
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_bookings_priority ON bookings(is_priority);

-- 5. DỮ LIỆU MẪU CÁC GÓI DỊCH VỤ (GIÁ THÂM NHẬP THỊ TRƯỜNG KHỞI NGHIỆP EXE101)
INSERT INTO service_packages (code, name, description, price, duration_months, maintenance_quota, warranty_days, priority_level, discount_percentage, badge, features)
VALUES 
(
    'basic_6m',
    'Gói Chăm Sóc Cơ Bản (HomeCare Basic)',
    'Chỉ 25k/tháng! Tiết kiệm phù hợp cho sinh viên, người độc thân hoặc căn hộ nhỏ cần bảo dưỡng đồ điện cơ bản.',
    149000,
    6,
    1,
    30,
    1,
    5,
    'Tiết kiệm sinh viên',
    '[
        "1 lần bảo dưỡng/vệ sinh máy lạnh hoặc quạt điện miễn phí",
        "Bảo hành công việc 30 ngày (HomeFix bảo chứng)",
        "Ưu tiên nhận đơn trước khách thông thường",
        "Giảm 5% giá nhân công cho các lần sửa chữa phát sinh",
        "Hỗ trợ tư vấn kỹ thuật trực tuyến 24/7"
    ]'::jsonb
),
(
    'standard_1y',
    'Gói Chăm Sóc Toàn Diện 1 Năm (HomeCare Standard)',
    'Lựa chọn phổ biến nhất cho gia đình từ 3-5 thành viên. Đảm bảo toàn bộ thiết bị điện lạnh, điện nước luôn hoạt động êm ái suốt cả năm.',
    299000,
    12,
    2,
    60,
    2,
    10,
    'Phổ biến nhất ⭐',
    '[
        "2 lần bảo dưỡng điều hòa / thiết bị gia dụng miễn phí trong 1 năm",
        "Bảo hành dịch vụ lên đến 60 ngày - Thợ xử lý miễn phí nếu tái phát",
        "⚡ Cam kết thợ nhận đơn trong vòng 15-30 phút (Hàng đợi ưu tiên)",
        "Giảm 10% chi phí nhân công toàn bộ dịch vụ phát sinh",
        "Miễn phí kiểm tra & chẩn đoán sự cố tại nhà (Call-out fee)"
    ]'::jsonb
),
(
    'vip_1y',
    'Gói VIP Thượng Hạng 1 Năm (HomeCare VIP Platinum)',
    'Đặc quyền cao cấp nhất dành cho gia đình, biệt thự và nhà phố. Thợ lành nghề hàng đầu (4.8★ - 5★) phục vụ tức thì.',
    599000,
    12,
    4,
    90,
    3,
    15,
    'Đặc quyền VIP 👑',
    '[
        "4 lần bảo dưỡng định kỳ trọn gói (2 máy lạnh + 1 máy giặt + 1 kiểm tra điện nước tổng)",
        "Bảo hành vàng 90 ngày (Miễn phí 100% công sửa nếu phát sinh lỗi)",
        "⚡ HỎA TỐC VIP: Thợ Top Rating (4.8★ - 5.0★) tiếp nhận ngay trong 5-10 phút",
        "Ưu tiên tuyệt đối vào giờ cao điểm, mưa bão, ngày lễ Tết",
        "Giảm 15% tổng hóa đơn nhân công sửa chữa",
        "Đường dây nóng hỗ trợ ưu tiên trực tiếp cùng Quản trị viên"
    ]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_months = EXCLUDED.duration_months,
    maintenance_quota = EXCLUDED.maintenance_quota,
    warranty_days = EXCLUDED.warranty_days,
    priority_level = EXCLUDED.priority_level,
    discount_percentage = EXCLUDED.discount_percentage,
    features = EXCLUDED.features,
    badge = EXCLUDED.badge;

-- RLS Policies
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read service_packages" ON service_packages
    FOR SELECT USING (true);

CREATE POLICY "Service role can do everything on service_packages" ON service_packages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on user_subscriptions" ON user_subscriptions
    FOR ALL USING (true) WITH CHECK (true);
