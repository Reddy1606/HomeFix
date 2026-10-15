import { useState } from 'react';
import {
  fetchAdminServices,
  createService,
  updateService,
} from '../../api/admin';
import useAdminResource from '../../hooks/useAdminResource';
import { Pagination, ResourceState } from '../../components/admin/AdminUI';
import { money } from '../../utils/admin';
import Modal from '../../components/admin/Modal';
import FormField from '../../components/auth/FormField';
import { SERVICE_CATEGORIES } from '../../data/mockServices';
import { PRICE_UNIT_LABEL } from '../../api/services';
import { apiError, fieldErrors } from '../../utils/validation';

const emptyService = {
  name: '',
  category: 'Điện lạnh',
  description: '',
  base_price: '',
  price_unit: 'per_job',
  warranty_days: '7',
  is_active: true,
};

function ServiceForm({ service, onClose, onSaved }) {
  const editing = Boolean(service?.id);
  const [values, setValues] = useState(
    service
      ? Object.fromEntries(
          Object.keys(emptyService).map((key) => [
            key,
            service[key] ?? emptyService[key],
          ])
        )
      : emptyService
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 200)
      nextErrors.name = 'Tên dịch vụ phải có từ 2 đến 200 ký tự.';
    if (!values.category) nextErrors.category = 'Chọn danh mục dịch vụ.';
    if (
      String(values.base_price).trim() === '' ||
      !Number.isSafeInteger(Number(values.base_price)) ||
      Number(values.base_price) < 0 ||
      Number(values.base_price) > 999999999999
    )
      nextErrors.base_price = 'Nhập giá nguyên từ 0 đến 999.999.999.999đ.';
    if (
      String(values.warranty_days).trim() === '' ||
      !Number.isInteger(Number(values.warranty_days)) ||
      Number(values.warranty_days) < 0 ||
      Number(values.warranty_days) > 365
    )
      nextErrors.warranty_days = 'Số ngày bảo hành phải từ 0 đến 365.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        base_price: Number(values.base_price),
        warranty_days: Number(values.warranty_days),
      };
      if (editing) await updateService(service.id, payload);
      else await createService(payload);
      onSaved(editing ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ mới.');
    } catch (error) {
      setMessage(apiError(error));
      setErrors(fieldErrors(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
      onClose={onClose}
      busy={busy}
    >
      {message && (
        <div className="hf-notice error" role="alert">
          {message}
        </div>
      )}
      <form onSubmit={save} noValidate>
        <fieldset disabled={busy}>
          <FormField
            label="Tên dịch vụ"
            name="name"
            required
            maxLength={200}
            value={values.name}
            onChange={change}
            error={errors.name}
            placeholder="Ví dụ: Bảo dưỡng máy lạnh"
          />
          <label className="hf-field" htmlFor="category">
            Danh mục *
            <select
              id="category"
              name="category"
              value={values.category}
              onChange={change}
              aria-invalid={Boolean(errors.category)}
            >
              {!SERVICE_CATEGORIES.some(
                (item) => item.name === values.category
              ) && <option value={values.category}>{values.category}</option>}
              {SERVICE_CATEGORIES.map((item) => (
                <option value={item.name} key={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="hf-field-error">{errors.category}</span>
            )}
          </label>
          <div className="form-columns">
            <FormField
              label="Giá niêm yết (VNĐ)"
              name="base_price"
              type="number"
              required
              min="0"
              step="1"
              value={values.base_price}
              onChange={change}
              error={errors.base_price}
            />
            <label className="hf-field" htmlFor="price_unit">
              Đơn vị giá
              <select
                id="price_unit"
                name="price_unit"
                value={values.price_unit}
                onChange={change}
              >
                {Object.entries(PRICE_UNIT_LABEL).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label.replace('/ ', '')}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <FormField
            label="Bảo hành (ngày)"
            name="warranty_days"
            type="number"
            required
            min="0"
            max="365"
            step="1"
            value={values.warranty_days}
            onChange={change}
            error={errors.warranty_days}
          />
          <label className="hf-field" htmlFor="description">
            Mô tả
            <textarea
              id="description"
              name="description"
              rows="4"
              value={values.description}
              onChange={change}
              placeholder="Nội dung công việc, phạm vi dịch vụ…"
            />
          </label>
          <label className="hf-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={values.is_active}
              onChange={change}
            />
            Hiển thị dịch vụ cho khách hàng
          </label>
          <div className="modal-actions">
            <button
              className="hf-button secondary"
              type="button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button className="hf-button" type="submit">
              {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export default function AdminServices() {
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    category: '',
    is_active: '',
  });
  const [search, setSearch] = useState('');
  const resource = useAdminResource(fetchAdminServices, {
    page: filters.page,
    limit: 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.is_active !== '' && { is_active: filters.is_active }),
  });
  const rows = resource.data?.services || [];
  const [editor, setEditor] = useState(null);
  const [toggle, setToggle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filter = (patch) =>
    setFilters((prev) => ({ ...prev, page: 1, ...patch }));
  const saved = (text) => {
    setEditor(null);
    setNotice(text);
    resource.reload();
  };
  async function confirmToggle() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await updateService(toggle.id, { is_active: !toggle.is_active });
      setNotice(
        toggle.is_active
          ? 'Đã ẩn dịch vụ khỏi danh sách khách hàng.'
          : 'Đã hiển thị lại dịch vụ.'
      );
      setToggle(null);
      resource.reload();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="hf-eyebrow">DANH MỤC & BẢNG GIÁ</span>
          <h1>Quản lý dịch vụ</h1>
          <p>Cập nhật dịch vụ, giá niêm yết và thời hạn bảo hành.</p>
        </div>
        <div className="heading-actions">
          <button
            className="hf-button secondary"
            disabled={resource.loading}
            onClick={resource.reload}
          >
            ↻ Làm mới
          </button>
          <button className="hf-button" onClick={() => setEditor({})}>
            + Thêm dịch vụ
          </button>
        </div>
      </div>
      {notice && (
        <div className="hf-notice success" role="status">
          {notice}
        </div>
      )}
      <section className="hf-card">
        <div className="admin-toolbar">
          <form
            className="admin-search"
            onSubmit={(event) => {
              event.preventDefault();
              filter({ search: search.trim() });
            }}
          >
            <label className="sr-only" htmlFor="service-search">
              Tìm dịch vụ
            </label>
            <input
              id="service-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên dịch vụ…"
            />
            <button className="hf-button secondary small">Tìm kiếm</button>
          </form>
          <label className="admin-select-label">
            Danh mục
            <select
              value={filters.category}
              onChange={(event) => filter({ category: event.target.value })}
            >
              <option value="">Tất cả danh mục</option>
              {SERVICE_CATEGORIES.map((item) => (
                <option key={item.slug} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-select-label">
            Hiển thị
            <select
              value={filters.is_active}
              onChange={(event) => filter({ is_active: event.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="true">Đang hiển thị</option>
              <option value="false">Đã ẩn</option>
            </select>
          </label>
        </div>
        <ResourceState {...resource} empty={!rows.length} />
        {!resource.loading && !resource.error && rows.length > 0 && (
          <div className="hf-table-wrap">
            <table className="hf-table">
              <thead>
                <tr>
                  <th scope="col">Dịch vụ</th>
                  <th scope="col">Danh mục</th>
                  <th scope="col">Giá niêm yết</th>
                  <th scope="col">Bảo hành</th>
                  <th scope="col">Hiển thị</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.name}</strong>
                      <span className="table-subtitle line-clamp-2 service-description">
                        {service.description}
                      </span>
                    </td>
                    <td>{service.category}</td>
                    <td>
                      <strong>{money(service.base_price)}</strong>
                      <span className="table-subtitle">
                        {PRICE_UNIT_LABEL[service.price_unit] ||
                          service.price_unit}
                      </span>
                    </td>
                    <td>{service.warranty_days} ngày</td>
                    <td>
                      <span
                        className={`status-badge ${service.is_active ? 'status-completed' : 'status-cancelled'}`}
                      >
                        {service.is_active ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="hf-table-action"
                          onClick={() => setEditor(service)}
                          aria-label={`Sửa ${service.name}`}
                        >
                          Sửa
                        </button>
                        <button
                          className="hf-table-action"
                          onClick={() => {
                            setToggle(service);
                            setError('');
                          }}
                          aria-label={`${service.is_active ? 'Ẩn' : 'Hiện'} ${service.name}`}
                        >
                          {service.is_active ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!resource.loading && !resource.error && (
          <Pagination
            pagination={resource.data?.pagination}
            page={filters.page}
            onChange={(page) => filter({ page })}
          />
        )}
      </section>
      {editor && (
        <ServiceForm
          service={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {toggle && (
        <Modal
          title={toggle.is_active ? 'Ẩn dịch vụ?' : 'Hiển thị dịch vụ?'}
          busy={busy}
          onClose={() => setToggle(null)}
        >
          <p className="hf-muted">
            {toggle.is_active
              ? `Khách hàng sẽ không thấy “${toggle.name}” trong danh sách dịch vụ.`
              : `Dịch vụ “${toggle.name}” sẽ xuất hiện lại cho khách hàng.`}
          </p>
          {error && (
            <div className="hf-notice error" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="hf-button secondary"
              disabled={busy}
              onClick={() => setToggle(null)}
            >
              Hủy
            </button>
            <button
              className="hf-button"
              disabled={busy}
              onClick={confirmToggle}
            >
              {busy ? 'Đang cập nhật…' : 'Xác nhận'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
