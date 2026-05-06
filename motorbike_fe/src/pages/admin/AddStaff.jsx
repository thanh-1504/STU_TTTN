import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStaff } from "../../api/usersService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

// Role mapping: frontend value -> backend roleId
const ROLE_MAP = {
  RECEPTIONIST: 2, // Adjust based on your database
  TECHNICIAN: 3, // Adjust based on your database
};

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    username: "",
    fullname: "",
    phone: "",
    email: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!form.username.trim()) {
      errors.username = "Tên đăng nhập không được để trống";
    } else if (form.username.length < 3) {
      errors.username = "Tên đăng nhập tối thiểu 3 ký tự";
    } else if (!/^[a-z0-9_.]+$/i.test(form.username)) {
      errors.username = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới";
    }

    if (!form.fullname.trim()) {
      errors.fullname = "Họ tên không được để trống";
    }

    if (!form.phone.trim()) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!/^(0|\+84)[0-9]{8,9}$/.test(form.phone)) {
      errors.phone =
        "Số điện thoại không hợp lệ (format: 0xxx xxx xxx hoặc +84xx...)";
    }

    if (!form.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!form.role) {
      errors.role = "Chức vụ không được để trống";
    }

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
      const result = await createStaff({
        username: form.username,
        fullname: form.fullname,
        phone: form.phone,
        email: form.email,
        roleId: ROLE_MAP[form.role],
      });

      if (result.success) {
        notify.success(`✨ Tạo nhân viên ${form.fullname} thành công!`);
        // Reset form
        setForm({
          username: "",
          fullname: "",
          phone: "",
          email: "",
          role: "",
        });
        setFieldErrors({});

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/admin/staff");
        }, 2000);
      } else {
        // Show validation errors from backend
        if (result.errors) {
          setFieldErrors(result.errors);

          // Show first error
          const firstError = Object.values(result.errors)[0];
          notify.error(firstError || "Tạo nhân viên thất bại");
        } else {
          notify.error("Tạo nhân viên thất bại");
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
        removeNotification={(id) => {}}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            Thêm Nhân Viên Mới
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Thông tin cá nhân */}
            <div className="border-b bg-stone-50 px-6 py-4 font-semibold">
              Thông tin cá nhân
            </div>

            <div className="p-6 space-y-5">
              {/* Tên đăng nhập & Họ tên */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="nguyenvana"
                    value={form.username}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
                      fieldErrors.username ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Nguyễn Văn A"
                    value={form.fullname}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
                      fieldErrors.fullname ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.fullname && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.fullname}
                    </p>
                  )}
                </div>
              </div>

              {/* Số điện thoại & Email */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="090x xxx xxx"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
                      fieldErrors.phone ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">
                    Email nhân viên *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@shop2banh.vn"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 ${
                      fieldErrors.email ? "border-red-500" : ""
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Chức vụ */}
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/admin/staff")}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-stone-200 hover:bg-stone-300 disabled:opacity-50 font-semibold transition"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-semibold transition"
            >
              {loading ? "⏳ Đang xử lý..." : "✓ Lưu thông tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Uncomment below if you want to add more features
/*
function FormError({ message }) {
  return (
    <p className="text-xs text-red-600 mt-1">{message}</p>
  );
}
*/
