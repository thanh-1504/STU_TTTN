// AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginStaff, saveAuthData } from "../../api/authService";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear errors when user starts typing
    if (error) setError("");
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Form submitted:", form);

    // Per-field validation
    const errors = { username: "", password: "" };
    if (!form.username.trim()) {
      errors.username = "Vui lòng nhập tên đăng nhập hoặc email";
    }
    if (!form.password.trim()) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (form.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (errors.username || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🚀 Calling loginStaff...");
      const data = await loginStaff(form.username, form.password);
      console.log("📦 Response data:", data);

      // Lưu token và thông tin người dùng
      saveAuthData(data.accessToken, "staff", data.user);
      console.log("💾 Auth data saved");

      // Redirect đến dashboard
      console.log("🔄 Redirecting to /admin");
      navigate("/admin");
    } catch (err) {
      console.error("💥 Error in handleSubmit:", err);
      const message =
        err.response?.data?.message || err.message || "Đăng nhập thất bại";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#f2b8ae_0.7px,transparent_0.7px)] [background-size:20px_20px]" />

      {/* Accent Image */}
      <div className="absolute top-0 right-0 opacity-5 hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c"
          alt="garage"
          className="h-screen w-[45vw] object-cover"
        />
      </div>

      {/* Main */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white border px-5 py-3 shadow-sm">
            <h1 className="text-red-700 text-2xl font-black uppercase tracking-tight">
              Shop2banh
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 shadow-xl p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Tên Đăng Nhập hoặc Email
              </label>

              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Tên đăng nhập hoặc email"
                disabled={loading}
                className={`w-full border px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 ${
                  fieldErrors.username ? "border-red-400" : "border-gray-300"
                }`}
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Mật Khẩu
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full border px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 ${
                    fieldErrors.password ? "border-red-400" : "border-gray-300"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  disabled={loading}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  disabled={loading}
                />
                Ghi nhớ phiên đăng nhập
              </label>

              <button
                type="button"
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white py-3 font-semibold transition"
            >
              {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
