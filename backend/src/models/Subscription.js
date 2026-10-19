const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../config/database');
const Package = require('./Package');

const LOCAL_SUBSCRIPTIONS_FILE = path.join(__dirname, '../../data/subscriptions.json');

function readLocalSubscriptions() {
  try {
    if (!fs.existsSync(LOCAL_SUBSCRIPTIONS_FILE)) {
      fs.mkdirSync(path.dirname(LOCAL_SUBSCRIPTIONS_FILE), { recursive: true });
      fs.writeFileSync(LOCAL_SUBSCRIPTIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(LOCAL_SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Lỗi đọc local subscriptions:', err.message);
    return [];
  }
}

function writeLocalSubscriptions(subs) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_SUBSCRIPTIONS_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi ghi local subscriptions:', err.message);
  }
}

class Subscription {
  /**
   * Tạo gói đăng ký mới cho khách hàng
   */
  static async create({ userId, packageId, paymentMethod = 'bank_transfer' }) {
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      throw new Error('Gói dịch vụ không tồn tại');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (pkg.duration_months || 12));

    const newSub = {
      id: crypto.randomUUID(),
      user_id: userId,
      package_id: pkg.id,
      package_name: pkg.name,
      price_paid: pkg.price,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      maintenance_quota: pkg.maintenance_quota || 0,
      remaining_quota: pkg.maintenance_quota || 0,
      priority_level: pkg.priority_level || 1,
      warranty_days: pkg.warranty_days || 60,
      discount_percentage: pkg.discount_percentage || 10,
      status: 'active',
      payment_method: paymentMethod,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Thử lưu vào Supabase
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([newSub])
        .select('*')
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Supabase chưa có bảng
    }

    // Fallback lưu local
    const localList = readLocalSubscriptions();
    // Chuyển các gói active cũ của user này sang expired nếu có
    localList.forEach((s) => {
      if (s.user_id === userId && s.status === 'active') {
        s.status = 'cancelled';
        s.updated_at = new Date().toISOString();
      }
    });
    localList.unshift(newSub);
    writeLocalSubscriptions(localList);
    return newSub;
  }

  /**
   * Tìm gói đang hoạt động của khách hàng
   */
  static async findActiveByUserId(userId) {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        const sub = data[0];
        // Kiểm tra xem đã hết hạn chưa
        if (new Date(sub.end_date) > new Date()) {
          return sub;
        }
      }
    } catch (e) {
      // fallback
    }

    const localList = readLocalSubscriptions();
    const now = new Date();
    const found = localList.find(
      (s) => s.user_id === userId && s.status === 'active' && new Date(s.end_date) > now
    );
    return found || null;
  }

  /**
   * Hủy gói thuê bao đang hoạt động của khách hàng
   */
  static async cancel(userId) {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .select();

      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // fallback
    }

    const localList = readLocalSubscriptions();
    let updated = null;
    localList.forEach((s) => {
      if (s.user_id === userId && s.status === 'active') {
        s.status = 'cancelled';
        s.updated_at = new Date().toISOString();
        updated = s;
      }
    });
    if (updated) {
      writeLocalSubscriptions(localList);
    }
    return updated;
  }

  /**
   * Trừ 1 lần bảo dưỡng định kỳ
   */
  static async useQuota(subscriptionId) {
    try {
      const { data: sub, error: subErr } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subErr && sub && sub.remaining_quota > 0) {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .update({
            remaining_quota: sub.remaining_quota - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();
        if (!error && data) return data;
      }
    } catch (e) {
      // fallback
    }

    const localList = readLocalSubscriptions();
    const target = localList.find((s) => s.id === subscriptionId);
    if (target && target.remaining_quota > 0) {
      target.remaining_quota -= 1;
      target.updated_at = new Date().toISOString();
      writeLocalSubscriptions(localList);
      return target;
    }
    return target || null;
  }

  /**
   * Lấy tất cả danh sách gói đăng ký (cho Admin)
   */
  static async findAll({ status = null, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let query = supabase
        .from('user_subscriptions')
        .select('*, users!user_id(id, full_name, email, phone)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      if (!error && Array.isArray(data)) {
        return { subscriptions: data, total: count || data.length };
      }
    } catch (e) {
      // fallback
    }

    const User = require('./User');
    let localList = readLocalSubscriptions();
    if (status) {
      localList = localList.filter((s) => s.status === status);
    }

    // Nạp thông tin user
    const paged = localList.slice(from, to + 1);
    const enriched = await Promise.all(
      paged.map(async (sub) => {
        try {
          const u = await User.findById(sub.user_id);
          return {
            ...sub,
            users: u ? { id: u.id, full_name: u.full_name, email: u.email, phone: u.phone } : null,
          };
        } catch {
          return sub;
        }
      })
    );

    return { subscriptions: enriched, total: localList.length };
  }

  /**
   * Thống kê số liệu subscription cho Admin Dashboard
   */
  static async getStats() {
    let allSubs = [];
    try {
      const { data, error } = await supabase.from('user_subscriptions').select('*');
      if (!error && Array.isArray(data)) {
        allSubs = data;
      } else {
        allSubs = readLocalSubscriptions();
      }
    } catch (e) {
      allSubs = readLocalSubscriptions();
    }

    const now = new Date();
    let totalRevenue = 0;
    let activeSubscribers = 0;
    const packageCounts = {};

    for (const sub of allSubs) {
      const isActive = sub.status === 'active' && new Date(sub.end_date) > now;
      if (isActive) {
        activeSubscribers++;
      }
      totalRevenue += Number(sub.price_paid) || 0;
      packageCounts[sub.package_name] = (packageCounts[sub.package_name] || 0) + 1;
    }

    // Doanh thu định kỳ hàng tháng ước tính (MRR = Total Subscription / 12)
    const estimatedMRR = Math.round(totalRevenue / 12);

    return {
      total_subscriptions: allSubs.length,
      active_subscribers: activeSubscribers,
      total_package_revenue: totalRevenue,
      estimated_mrr: estimatedMRR,
      package_distribution: packageCounts,
    };
  }
}

module.exports = Subscription;
