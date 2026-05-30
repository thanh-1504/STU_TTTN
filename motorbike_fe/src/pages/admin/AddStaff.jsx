import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createStaff,
  getStaffById,
  toggleStaffActive,
  updateStaff,
} from "../../api/usersService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const ROLE_MAP = {
  RECEPTIONIST: 2,
  TECHNICIAN: 3,
};

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    username: "",
    fullname: "",
    phone: "",
    email: "",
    role: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [fieldErrors, setFieldErrors] = useState({});
  const [initialIsActive, setInitialIsActive] = useState(true);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchStaff = async () => {
      try {
        const data = await getStaffById(id);
        setForm({
          username: data.username || "",
          fullname: data.fullname || "",
          phone: data.phone || "",
          email: data.email || "",
          role: data.role?.roleName || "",
          isActive: data.isActive ?? true,
        });
        setInitialIsActive(data.isActive ?? true);
      } catch (error) {
        console.error("Error fetching staff:", error);
        notify.error("Không tải được thông tin nhân viên");
        setTimeout(() => navigate("/admin/staff"), 1200);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStaff();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!isEditMode) {
      if (!form.username.trim()) {
        errors.username = "Tên đăng nhập không được để trống";
      } else if (form.username.length < 3) {
        errors.username = "Tên đăng nhập tối thiểu 3 ký tự";
      } else if (!/^[a-z0-9_.]+$/i.test(form.username)) {
        errors.username = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới";
      }
    }

    if (!form.fullname.trim()) errors.fullname = "Họ tên không được để trống";

    if (!form.phone.trim()) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!/^(0|\+84)[0-9]{8,9}$/.test(form.phone)) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!form.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!form.role) errors.role = "Chức vụ không được để trống";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      notify.error("Vui lòng kiểm tra các trường bắt buộc");
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isEditMode) {
        result = await updateStaff(id, {
          fullname: form.fullname,
          phone: form.phone,
          email: form.email,
          roleId: ROLE_MAP[form.role],
        });
        if (result.success && form.isActive !== initialIsActive) {
          await toggleStaffActive(id);
        }
      } else {
        result = await createStaff({
          username: form.username,
          fullname: form.fullname,
          phone: form.phone,
          email: form.email,
          roleId: ROLE_MAP[form.role],
        });
      }

      if (result.success) {
        notify.success(
          isEditMode
            ? `Cập nhật nhân viên ${form.fullname} thành công!`
            : `Tạo nhân viên ${form.fullname} thành công!`,
        );
        setTimeout(() => navigate("/admin/staff"), 1500);
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
          const firstError = Object.values(result.errors)[0];
          notify.error(
            firstError ||
              (isEditMode ? "Cập nhật thất bại" : "Tạo nhân viên thất bại"),
          );
        } else {
          notify.error(
            isEditMode ? "Cập nhật thất bại" : "Tạo nhân viên thất bại",
          );
        }
      }
    } catch (error) {
      console.error("Error:", error);
      notify.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-8">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-stone-900">
          {isEditMode ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </h1>

        {initialLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-white">
            <span className="text-stone-500">Đang tải...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="border-b bg-stone-50 px-6 py-4 font-semibold">
                Thông tin cá nhân
              </div>

              <div className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field
                    label="Tên đăng nhập *"
                    name="username"
                    placeholder="nguyenvana"
                    value={form.username}
                    onChange={handleChange}
                    disabled={loading || isEditMode}
                    error={fieldErrors.username}
                  />
                  <Field
                    label="Họ và tên *"
                    name="fullname"
                    placeholder="Nguyễn Văn A"
                    value={form.fullname}
                    onChange={handleChange}
                    disabled={loading}
                    error={fieldErrors.fullname}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Field
                    label="Số điện thoại *"
                    name="phone"
                    type="tel"
                    placeholder="090x xxx xxx"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    error={fieldErrors.phone}
                  />
                  <Field
                    label="Email *"
                    name="email"
                    type="email"
                    placeholder="example@shop2banh.vn"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    error={fieldErrors.email}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">
                    Chức vụ *
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
                      fieldErrors.role ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    <option value="RECEPTIONIST">Lễ Tân</option>
                    <option value="TECHNICIAN">Kỹ Thuật Viên</option>
                  </select>
                  {fieldErrors.role && (
                    <p className="text-xs text-red-600">{fieldErrors.role}</p>
                  )}
                </div>

                {isEditMode && (
                  <div className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        Trạng thái tài khoản
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {form.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          isActive: !prev.isActive,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        form.isActive ? "bg-green-500" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          form.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin/staff")}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-50 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-lg bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-semibold"
              >
                {loading
                  ? "Đang xử lý..."
                  : isEditMode
                    ? "Cập nhật"
                    : "Lưu thông tin"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
          error ? "border-red-500" : ""
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
