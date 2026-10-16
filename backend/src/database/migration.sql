-- ================================================================
-- HomeFix Database Schema - Chạy trên Supabase SQL Editor
-- Tạo 3 bảng: users, services, bookings
-- ================================================================

-- ==================== BẢNG USERS ====================
-- Hỗ trợ 3 role: customer, technician, admin
-- Bao gồm trường KYC cho thợ (CCCD, lý lịch tư pháp)
CREATE TABLE IF NOT EXISTS users (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) UNIQUE,
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'technician', 'admin')),
    address         TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    
    -- Thông tin KYC cho thợ (theo đề án: CCCD gắn chip + Lý lịch tư pháp)
    cccd_number         VARCHAR(20),
    cccd_image          TEXT,
    criminal_record_url TEXT,
    skill_verified      BOOLEAN DEFAULT FALSE,
    
    -- Đánh giá
    rating_avg      DECIMAL(2,1) DEFAULT 0,
    total_reviews   INT DEFAULT 0,
    
    -- Trạng thái
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== BẢNG SERVICES ====================
-- Danh mục dịch vụ sửa chữa với bảng giá niêm yết
CREATE TABLE IF NOT EXISTS services (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    base_price      DECIMAL(12,0) NOT NULL,
    price_unit      VARCHAR(50) DEFAULT 'per_job',
    warranty_days   INT DEFAULT 7,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== BẢNG BOOKINGS ====================
-- Đơn đặt thợ sửa chữa (đặt tức thì hoặc hẹn giờ)
CREATE TABLE IF NOT EXISTS bookings (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technician_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending',
                        'confirmed',
                        'in_progress',
                        'completed',
                        'cancelled',
                        'warranty_claim'
                    )),
    booking_type    VARCHAR(20) DEFAULT 'immediate'
                    CHECK (booking_type IN ('immediate', 'scheduled')),
    scheduled_at    TIMESTAMPTZ,
    address         TEXT NOT NULL,
    description     TEXT,
    total_price     DECIMAL(12,0),
    commission_rate DECIMAL(4,2) DEFAULT 0.15,
    warranty_until  DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- ==================== DỮ LIỆU MẪU ====================

-- Tạo tài khoản Admin mặc định
-- Password: Admin@123 (đã hash bằng bcrypt salt 12)
INSERT INTO users (email, password_hash, full_name, phone, role, is_verified, is_active)
VALUES (
    'admin@homefix.vn',
    '$2b$12$QeFuTUC6oW109WIkmBpodeZOMBQjYdgv..LfnyfeJJl7TrLye8GHe',
    'HomeFix Admin',
    '0900000000',
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Dịch vụ mẫu theo đề án
INSERT INTO services (name, category, description, base_price, price_unit, warranty_days) VALUES
    ('Bảo dưỡng máy lạnh', 'Điện lạnh', 'Vệ sinh, kiểm tra gas, bảo dưỡng máy lạnh định kỳ', 200000, 'per_job', 30),
    ('Sửa máy lạnh không lạnh', 'Điện lạnh', 'Kiểm tra và sửa chữa máy lạnh không làm lạnh', 350000, 'per_job', 30),
    ('Thay vòi nước', 'Điện nước', 'Thay thế vòi nước bồn rửa, lavabo', 150000, 'per_job', 14),
    ('Sửa rò rỉ ống nước', 'Điện nước', 'Tìm và sửa chữa điểm rò rỉ ống nước', 250000, 'per_job', 14),
    ('Sửa aptomat chập cháy', 'Điện nước', 'Kiểm tra, thay thế aptomat bị chập', 200000, 'per_job', 14),
    ('Thay bóng đèn', 'Điện nước', 'Thay thế bóng đèn các loại', 80000, 'per_job', 7),
    ('Sửa máy giặt', 'Thiết bị gia dụng', 'Kiểm tra và sửa chữa máy giặt không hoạt động', 300000, 'per_job', 30),
    ('Sửa khóa cửa', 'Đồ gỗ nội thất', 'Sửa chữa hoặc thay thế khóa cửa', 180000, 'per_job', 14),
    ('Sửa quạt treo tường', 'Thiết bị gia dụng', 'Sửa chữa quạt treo tường không quay, kêu to', 120000, 'per_job', 14),
    ('Kiểm tra hệ thống điện nước tổng', 'Điện nước', 'Rà soát toàn bộ hệ thống điện nước trong nhà', 500000, 'per_job', 7)
ON CONFLICT DO NOTHING;

-- ==================== BẢNG REVIEWS ====================
-- Đánh giá & phản hồi chất lượng thợ sau khi đơn hoàn thành (completed)
CREATE TABLE IF NOT EXISTS reviews (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);

-- ==================== DISABLE RLS (cho development) ====================
-- Lưu ý: Trong production cần bật RLS và thiết lập policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy cho phép service_role bypass RLS (backend dùng service_role key)
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on services" ON services
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on bookings" ON bookings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on reviews" ON reviews
    FOR ALL USING (true) WITH CHECK (true);
