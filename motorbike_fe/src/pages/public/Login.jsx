import { useState } from "react";
import { NavLink, Navigate, useNavigate } from "react-router-dom";
import {
  customerLogin,
  customerRegister,
  getToken,
  saveAuthData,
} from "../../api/authService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)[3-9]\d{8}$/;

export default function LoginPage() {
  const navigate = useNavigate();

  // Redirect nếu đã đăng nhập
  if (getToken("customer")) {
    return <Navigate to="/booking" replace />;
  }

  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const email = loginEmail.trim().toLowerCase();
      const data = await customerLogin(email, loginPassword);
      saveAuthData(data.accessToken, "customer", data.customer);
      navigate("/booking");
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Đăng nhập thất bại";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  const validateRegister = () => {
    const errors = [];

    if (!regName.trim()) {
      errors.push("Vui lòng nhập họ và tên");
    }

    if (!regEmail.trim()) {
      errors.push("Vui lòng nhập email");
    } else if (!EMAIL_REGEX.test(regEmail.trim())) {
      errors.push("Email không hợp lệ");
    }

    if (!regPhone.trim()) {
      errors.push("Vui lòng nhập số điện thoại");
    } else if (!PHONE_REGEX.test(regPhone.trim())) {
      errors.push("Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)");
    }

    if (!regPassword) {
      errors.push("Vui lòng nhập mật khẩu");
    } else if (regPassword.length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    }

    if (!regConfirmPassword) {
      errors.push("Vui lòng nhập xác nhận mật khẩu");
    } else if (regPassword !== regConfirmPassword) {
      errors.push("Mật khẩu xác nhận không khớp");
    }

    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const errors = validateRegister();
    if (errors.length > 0) {
      setError(errors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await customerRegister({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        customerName: regName.trim(),
        phone: regPhone.trim(),
      });
      saveAuthData(data.accessToken, "customer", data.customer);
      navigate("/booking");
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Đăng ký thất bại";
      setError(Array.isArray(message) ? message : message);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center justify-center">
          <NavLink
            to={"/"}
            className="text-xl font-black uppercase text-red-600"
          >
            Shop2banh
          </NavLink>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              tab === "login"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              tab === "register"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
              {Array.isArray(error) ? (
                <ul className="list-disc pl-5 space-y-1">
                  {error.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                error
              )}
            </div>
          )}

          {/* ── LOGIN TAB ─────────────────────────────── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPwd ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading}
                      className="w-full border rounded-lg px-4 py-3 pr-11 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowLoginPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      {showLoginPwd ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-semibold transition mt-2"
                >
                  {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER TAB ──────────────────────────── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} noValidate>
              <div className="text-center mb-7">
                <h2 className="text-2xl font-bold">Tạo tài khoản</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Đăng ký để sử dụng đầy đủ dịch vụ
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="example@email.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="0901234567"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPwd ? "text" : "password"}
                      placeholder="Ít nhất 6 ký tự"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading}
                      className="w-full border rounded-lg px-4 py-3 pr-11 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowRegPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      {showRegPwd ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="reg-confirm-password"
                    type={showRegPwd ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 text-sm"
                  />
                </div>

                <button
                  id="btn-register"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-semibold transition mt-2"
                >
                  {loading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
