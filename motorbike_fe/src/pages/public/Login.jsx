// LoginPage.jsx
import { useEffect, useState } from "react";
import { NavLink, Navigate, useNavigate } from "react-router-dom";
import { getToken, saveAuthData, sendOtp, verifyOtp } from "../../api/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  // Redirect nếu đã đăng nhập
  if (getToken()) {
    return <Navigate to="/booking" replace />;
  }

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer cho "Gửi lại mã"
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtp(phone);
      setStep("otp");
      setCountdown(60); // 60 giây countdown
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Gửi OTP thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus to next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyOtp(phone, code);
      saveAuthData(data.accessToken, "customer", data.customer);
      navigate("/"); // Redirect to customer portal
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Xác thực OTP thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      handleSendOtp();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <NavLink to="/" className="text-sm text-gray-500 hover:text-red-600">
            ← Trang chủ
          </NavLink>

          <h1 className="text-xl font-black uppercase text-red-600">
            Shop2banh
          </h1>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* PHONE STEP */}
          {step === "phone" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Đăng nhập</h2>
                <p className="text-gray-500 mt-2">
                  Nhập số điện thoại để nhận mã OTP
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Số điện thoại
                  </label>

                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại của bạn"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100"
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-semibold transition"
                >
                  {loading ? "ĐANG GỬI..." : "GỬI MÃ OTP"}
                </button>
              </div>
            </>
          )}

          {/* OTP STEP */}
          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Xác thực OTP</h2>

                <p className="text-gray-500 mt-2">
                  Mã đã gửi đến{" "}
                  <span className="font-semibold text-black">{phone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    disabled={loading}
                    className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100"
                  />
                ))}
              </div>

              <div className="flex justify-between text-sm mb-6">
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
                </button>
                <span className="text-gray-500">
                  {String(countdown).padStart(2, "0")}:
                  {String(countdown % 60).padStart(2, "0")}
                </span>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-semibold transition"
              >
                {loading ? "ĐANG KIỂM TRA..." : "XÁC NHẬN"}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setPhone("");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Quay lại
              </button>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs uppercase text-gray-400">Hoặc</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Social Login */}
          <div className="space-y-4">
            <button className="w-full border py-3 rounded-lg hover:bg-gray-50 transition font-medium">
              Tiếp tục với Google
            </button>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-medium">
              Tiếp tục với Facebook
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-gray-500 mt-8 leading-5">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <span className="text-blue-600 cursor-pointer">
              Điều khoản dịch vụ
            </span>{" "}
            và{" "}
            <span className="text-blue-600 cursor-pointer">
              Chính sách bảo mật
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
