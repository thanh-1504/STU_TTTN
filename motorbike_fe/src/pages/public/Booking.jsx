import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate } from "react-router-dom";
import {
  createAppointment,
  getAvailableSlots,
} from "../../api/appointmentsService";
import { getServicesForCustomer } from "../../api/servicesService";
import { getPublicTechnicians } from "../../api/usersService";
import { useCart } from "../../contexts/CartContext";

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (v) => Number(v || 0).toLocaleString("vi-VN");

/** Returns today's date as YYYY-MM-DD in LOCAL time */
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Generate 30-min slots from startH:00 to endH:00 */
function generateSlots(startHour, endHour) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

/** All day slots 09:00 – 20:00 */

// ─── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ onNavigate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Đặt Lịch Thành Công!
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận sớm
          nhất.
        </p>
        <button
          onClick={onNavigate}
          className="w-full bg-[#d7000e] text-white font-bold py-3 rounded-full hover:bg-red-700 transition-colors"
        >
          Xem lịch sử đặt lịch
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Booking() {
  const navigate = useNavigate();
  const { items: cartItems, serviceIdsFromCart, clearCart } = useCart();
  const hasPrefilledFromCart = useRef(false);

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [errors, setErrors] = useState({});

  // ── Service rows ─────────────────────────────────────────────────────────────
  // Each row is a serviceId (string) or "" for unselected
  const [serviceRows, setServiceRows] = useState([""]);

  // ── All services from API ────────────────────────────────────────────────────
  const [allServices, setAllServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // ── Date / time ──────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // ── Technicians ──────────────────────────────────────────────────────────────
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);

  // ── Success modal ─────────────────────────────────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Submitting ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ─── Load services & technicians ──────────────────────────────────────────────
  useEffect(() => {
    // Pre-fill from localStorage
    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const displayName =
        userInfo.customerName || userInfo.fullname || userInfo.name || "";
      if (displayName) setName(displayName);
      if (userInfo.phone) setPhone(userInfo.phone);
    } catch (_) {}

    // Services
    getServicesForCustomer()
      .then((data) =>
        setAllServices(
          Array.isArray(data) ? data.filter((s) => s.isActive) : [],
        ),
      )
      .catch(console.error)
      .finally(() => setServicesLoading(false));

    // Technicians
    getPublicTechnicians()
      .then((data) => setTechnicians(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (hasPrefilledFromCart.current) return;
    if (serviceIdsFromCart.length === 0) return;
    setServiceRows(serviceIdsFromCart.map((id) => String(id)));
    hasPrefilledFromCart.current = true;
  }, [serviceIdsFromCart]);

  // ─── Load slots when date changes ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime("");
    getAvailableSlots(selectedDate)
      .then((res) => setAvailableSlots(res?.availableSlots || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  // ─── Derived: selected service objects ───────────────────────────────────────
  const selectedServices = useMemo(() => {
    return serviceRows
      .map((id) => allServices.find((s) => String(s.id) === id))
      .filter(Boolean);
  }, [serviceRows, allServices]);

  const estimatedCost = selectedServices.reduce(
    (sum, s) => sum + Number(s.priceManual || 0),
    0,
  );
  const estimatedDuration = selectedServices.reduce(
    (sum, s) => sum + Number(s.durationMinutes || 0),
    0,
  );

  // ─── Service row handlers ─────────────────────────────────────────────────────
  const handleServiceChange = (index, value) => {
    setServiceRows((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (errors.services) setErrors((p) => ({ ...p, services: "" }));
  };

  const handleAddServiceRow = () => {
    setServiceRows((prev) => [...prev, ""]);
  };

  const handleRemoveServiceRow = (index) => {
    setServiceRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Validation & submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Vui lòng nhập họ và tên.";
    if (!phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại.";
    const chosenServiceIds = serviceRows.filter(Boolean);
    if (chosenServiceIds.length === 0)
      newErrors.services = "Vui lòng chọn ít nhất một dịch vụ.";
    if (!selectedDate) newErrors.date = "Vui lòng chọn ngày đặt lịch.";
    if (!selectedTime) newErrors.time = "Vui lòng chọn khung giờ.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const appointmentTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const selectedTech = technicians.find(
        (t) => t.id === selectedTechnicianId,
      );
      const notes = [
        `Khách hàng: ${name}`,
        `SĐT: ${phone}`,
        selectedTech ? `KTV mong muốn: ${selectedTech.fullname}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      await createAppointment({
        appointmentTime: appointmentTime.toISOString(),
        symptoms: symptoms || "Không có mô tả thêm",
        notes,
        serviceIds: chosenServiceIds.map(Number),
        technicianId: selectedTechnicianId ?? undefined,
      });

      if (cartItems.length > 0) {
        clearCart();
      }

      setShowSuccess(true);
    } catch (err) {
      console.log(err.response?.data);
      if (err.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để đặt lịch.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const data = err.response?.data;
        // Ưu tiên errors[] (Zod validation) → message string (BadRequestException) → fallback
        const raw = Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors.map((e) => e.message).join("\n")
          : typeof data?.message === "string"
            ? data.message
            : err.message || "Đã xảy ra lỗi không xác định.";
        toast.error(raw, { style: { whiteSpace: "pre-line" } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const SELECT_STYLE = {
    backgroundImage:
      "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')",
    backgroundPosition: "right 1rem center",
    backgroundSize: "1.2em",
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f4f4f4] font-['Work_Sans'] min-h-screen">
      {showSuccess && <SuccessModal onNavigate={() => navigate("/history")} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <NavLink
            to="/"
            className="text-2xl font-black text-red-600 uppercase tracking-tight"
          >
            Shop2banh
          </NavLink>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[380px] flex items-center justify-center overflow-hidden">
        <img
          alt="Workshop Hero"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-50"
          src="https://images.unsplash.com/photo-1623221013483-1f3cbeffdcec?q=80&w=870&auto=format&fit=crop"
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-wider uppercase">
            ĐẶT LỊCH SỬA CHỮA
          </h1>
          <p className="text-white/80 mt-3 text-sm md:text-base">
            Nhanh chóng · Tiện lợi · Chuyên nghiệp
          </p>
        </div>
      </section>

      {/* MAIN */}
      <main className="container mx-auto px-4 -mt-14 relative z-20 pb-24">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Form Header */}
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-800">
              Quý khách vui lòng cho biết thông tin
            </h2>
            <p className="text-gray-500 text-sm mt-1 italic">
              <span className="text-red-600">(*)</span> Vui lòng nhập thông tin
              bắt buộc
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit} noValidate>
            {/* ── Personal Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <div className="relative">
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={`w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#d7000e] ${errors.name ? "border-red-400" : "border-gray-300"}`}
                    placeholder="Họ Và Tên"
                    type="text"
                  />
                  <span className="absolute right-3 top-3 text-red-600">*</span>
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <div className="relative">
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className={`w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#d7000e] ${errors.phone ? "border-red-400" : "border-gray-300"}`}
                    placeholder="Số Điện Thoại"
                    type="tel"
                  />
                  <span className="absolute right-3 top-3 text-red-600">*</span>
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* ── Service Selection ── */}
            <div className="space-y-3">
              <label className="block font-bold text-gray-700">
                Chọn dịch vụ <span className="text-red-600">*</span>
              </label>

              {cartItems.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-gray-600">
                  <p className="font-semibold text-red-600">
                    Dịch vụ từ giỏ hàng:
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {cartItems
                      .map((item) =>
                        item.type === "combo"
                          ? `Combo: ${item.name}`
                          : item.name,
                      )
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              )}

              {servicesLoading ? (
                <div className="text-sm text-gray-400 animate-pulse py-3">
                  Đang tải danh sách dịch vụ...
                </div>
              ) : (
                <>
                  {serviceRows.map((rowVal, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={rowVal}
                        onChange={(e) =>
                          handleServiceChange(idx, e.target.value)
                        }
                        className={`flex-1 border rounded-lg py-3 px-4 appearance-none bg-no-repeat focus:outline-none focus:ring-2 focus:ring-[#d7000e] pr-10 ${errors.services && !rowVal ? "border-red-400" : "border-gray-300"}`}
                        style={SELECT_STYLE}
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {allServices.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.serviceName}
                          </option>
                        ))}
                      </select>

                      {/* Remove row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceRow(idx)}
                        disabled={serviceRows.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-2xl leading-none"
                        title="Xóa dịch vụ này"
                      >
                        ⊖
                      </button>
                    </div>
                  ))}

                  {errors.services && (
                    <p className="text-red-500 text-xs">{errors.services}</p>
                  )}

                  {/* Add service button */}
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="bg-[#d7000e] text-white font-bold py-3 px-10 rounded-full hover:bg-red-700 transition-colors uppercase tracking-widest text-sm cursor-pointer"
                    >
                      THÊM DỊCH VỤ
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Estimated Info ── */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm font-semibold border border-gray-100">
              <p>
                Chi phí dự kiến:{" "}
                <span className="text-red-600">
                  {formatPrice(estimatedCost)}đ
                </span>
              </p>
              <p>
                Thời lượng dự kiến:{" "}
                <span className="text-red-600">{estimatedDuration} phút</span>
              </p>
            </div>

            {/* ── Date Picker ── */}
            <div className="space-y-2">
              <label className="block font-bold text-gray-700">
                Ngày đặt lịch <span className="text-red-600">*</span>
              </label>
              <input
                value={selectedDate}
                min={todayLocal()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: "" }));
                }}
                className={`w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#d7000e] ${errors.date ? "border-red-400" : "border-gray-300"}`}
                type="date"
              />
              {errors.date && (
                <p className="text-red-500 text-xs">{errors.date}</p>
              )}
            </div>

            {/* ── Time Slots ── */}
            <div className="space-y-3">
              <label className="block font-bold text-gray-700">
                Chọn khung giờ dịch vụ <span className="text-red-600">*</span>
              </label>

              {slotsLoading ? (
                <div className="text-sm text-gray-400 animate-pulse">
                  Đang tải khung giờ...
                </div>
              ) : !availableSlots || availableSlots.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Không còn khung giờ nào trống trong ngày này. Vui lòng chọn
                  ngày khác.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {/* Vòng lặp map thẳng vào mảng data của Backend */}
                  {availableSlots.map((slot) => {
                    const active = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(slot);
                          if (errors.time)
                            setErrors((p) => ({ ...p, time: "" }));
                        }}
                        className={`py-2.5 rounded-lg font-bold text-sm transition-all border ${
                          active
                            ? "bg-[#d7000e] text-white border-[#d7000e] shadow-md scale-105"
                            : "bg-red-50 text-[#d7000e] border-red-200 hover:bg-[#d7000e] hover:text-white"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              {errors.time && (
                <p className="text-red-500 text-xs">{errors.time}</p>
              )}
            </div>

            {/* ── Technician Selection (optional) ── */}
            <div className="space-y-3">
              <label className="block font-bold text-gray-700">
                Chọn kỹ thuật viên{" "}
              </label>

              {technicians.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Chưa có kỹ thuật viên.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {technicians.map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setSelectedTechnicianId(tech.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        selectedTechnicianId === tech.id
                          ? "border-[#d7000e] bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {tech.avatarUrl ? (
                        <img
                          src={tech.avatarUrl}
                          alt={tech.fullname}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-[#d7000e] font-bold text-lg">
                          {(tech.fullname ||
                            tech.username ||
                            "?")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">
                        {tech.fullname || tech.username}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Symptoms / Notes ── */}
            <div>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#d7000e]"
                placeholder="Mô tả triệu chứng hoặc ghi chú thêm (không bắt buộc)"
                rows={4}
              />
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#d7000e] text-white font-extrabold py-4 px-16 rounded-full hover:bg-red-700 transition-all hover:scale-105 flex items-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                {submitting ? <>Đang xử lý...</> : <>ĐẶT LỊCH</>}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="text-xl font-black text-white uppercase mb-3">
                Shop2banh
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Hệ thống dịch vụ xe máy chuyên nghiệp, uy tín tại TP.HCM.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Dịch vụ
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  "Bảo dưỡng định kỳ",
                  "Thay nhớt",
                  "Rửa xe",
                  "Sửa chữa điện",
                  "Thay lốp",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/services"
                      className="hover:text-red-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Hỗ trợ
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  "Hướng dẫn đặt lịch",
                  "Chính sách bảo hành",
                  "Câu hỏi thường gặp",
                  "Liên hệ",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Liên hệ
              </h4>
              <ul className="space-y-2 text-sm">
                <li>309 Vườn Lài, P. Phú Thọ Hòa, Q. Tân Phú, TP.HCM</li>
                <li>
                  SĐT:{" "}
                  <a href="tel:0938820202" className="hover:text-red-400">
                    0938.82.02.02
                  </a>
                </li>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:info@shop2banh.vn"
                    className="hover:text-red-400"
                  >
                    shop2banh@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
