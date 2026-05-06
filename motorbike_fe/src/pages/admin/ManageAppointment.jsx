import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAppointment,
  getAdminAppointmentDetail,
  getAvailableSlots,
  updateAppointment,
} from "../../api/appointmentsService";
import { useNotification } from "../../components/Notification";

const services = [
  "Bảo dưỡng tổng quát",
  "Thay nhớt & Lọc nhớt",
  "Vệ sinh kim phun",
  "Làm nồi",
];

const brands = ["Honda", "Yamaha", "Suzuki", "Kymco"];

const ManageAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const [form, setForm] = useState({
    phone: "",
    name: "",
    brand: "",
    model: "",
    plate: "",
    note: "",
    date: "",
    time: "",
    technician: "",
    services: [],
    symptoms: "",
    vehicleId: null,
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode] = useState(!!id);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  // Fetch available slots when date changes
  const fetchAvailableSlots = useCallback(
    async (date) => {
      if (!date) return;
      try {
        const slots = await getAvailableSlots(date);
        setAvailableSlots(slots || []);
      } catch (err) {
        notify.error("Lỗi tải slot giờ");
        console.error(err);
      }
    },
    [notify],
  );

  useEffect(() => {
    if (form.date) {
      fetchAvailableSlots(form.date);
    }
  }, [form.date, fetchAvailableSlots]);

  // Fetch appointment detail if edit mode
  useEffect(() => {
    if (id && isEditMode) {
      fetchAppointmentDetail(id);
    }
  }, [id]);

  const fetchAppointmentDetail = async (appointmentId) => {
    try {
      setLoading(true);
      const appointment = await getAdminAppointmentDetail(appointmentId);
      const appointmentDate = new Date(appointment.appointmentTime)
        .toISOString()
        .split("T")[0];
      const appointmentTime = new Date(appointment.appointmentTime)
        .toTimeString()
        .substring(0, 5);

      setForm({
        phone: appointment.customer?.phone || "",
        name: appointment.customer?.name || "",
        brand: appointment.vehicle?.brand || "",
        model: appointment.vehicle?.model || "",
        plate: appointment.vehicle?.licensePlate || "",
        date: appointmentDate,
        time: appointmentTime,
        symptoms: appointment.symptoms || "",
        note: appointment.notes || "",
        vehicleId: appointment.vehicleId,
        services: [],
        technician: "",
      });
    } catch (err) {
      notify.error("Lỗi tải chi tiết lịch hẹn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      notify.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!form.phone.trim()) {
      notify.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!form.date) {
      notify.error("Vui lòng chọn ngày hẹn");
      return;
    }
    if (!form.time) {
      notify.error("Vui lòng chọn giờ hẹn");
      return;
    }
    if (!form.symptoms.trim() && form.services.length === 0) {
      notify.error("Vui lòng mô tả triệu chứng hoặc chọn dịch vụ");
      return;
    }

    try {
      setLoading(true);
      const appointmentDateTime = new Date(`${form.date}T${form.time}:00Z`);

      const data = {
        appointmentTime: appointmentDateTime.toISOString(),
        vehicleId: form.vehicleId || undefined,
        symptoms: form.symptoms || undefined,
        notes: form.note || undefined,
      };

      if (isEditMode) {
        await updateAppointment(id, data);
        notify.success("Cập nhật lịch hẹn thành công");
      } else {
        await createAppointment(data);
        notify.success("Tạo lịch hẹn thành công");
      }

      setTimeout(() => navigate("/admin/appointments"), 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Lỗi khi tạo/cập nhật lịch hẹn";
      notify.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fbf9f8]">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* MAIN */}
      <div className="flex-1">
        {/* TOPBAR */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <h1 className="font-bold text-red-700">
            {isEditMode ? "Chỉnh sửa lịch hẹn" : "Tạo lịch hẹn mới"}
          </h1>
        </header>

        <main className="p-6 grid lg:grid-cols-3 gap-6">
          {/* LEFT FORM */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <div className="bg-white p-6 rounded border">
              <h3 className="font-bold mb-4">Thông tin khách hàng</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  name="phone"
                  placeholder="SĐT"
                  value={form.phone}
                  className="border p-2 rounded"
                  onChange={handleChange}
                />

                <input
                  name="name"
                  placeholder="Tên khách"
                  value={form.name}
                  className="border p-2 rounded"
                  onChange={handleChange}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <select
                  name="brand"
                  value={form.brand}
                  className="border p-2 rounded"
                  onChange={handleChange}
                >
                  <option value="">Hãng xe</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <input
                  name="model"
                  placeholder="Dòng xe"
                  value={form.model}
                  className="border p-2 rounded"
                  onChange={handleChange}
                />

                <input
                  name="plate"
                  placeholder="Biển số"
                  value={form.plate}
                  className="border p-2 rounded"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SERVICES */}
            <div className="bg-white p-6 rounded border">
              <h3 className="font-bold mb-4">Triệu chứng & Dịch vụ</h3>

              <textarea
                name="symptoms"
                placeholder="Mô tả tình trạng xe..."
                value={form.symptoms}
                className="w-full border p-2 rounded mb-4"
                rows="3"
                onChange={handleChange}
              />

              <h4 className="text-sm font-semibold mb-2">Dịch vụ liên quan:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {services.map((s) => (
                  <label key={s} className="border p-2 rounded flex gap-2">
                    <input
                      type="checkbox"
                      checked={form.services.includes(s)}
                      onChange={() => toggleService(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold">Ghi chú thêm:</label>
                <textarea
                  name="note"
                  placeholder="Ghi chú..."
                  value={form.note}
                  className="w-full border p-2 rounded mt-1"
                  rows="2"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* TIME */}
            <div className="bg-white p-6 rounded border">
              <h3 className="font-bold mb-4">Thời gian hẹn</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Ngày
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    className="border p-2 w-full rounded"
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Giờ ({availableSlots.length} slot còn)
                  </label>
                  <select
                    name="time"
                    value={form.time}
                    className="border p-2 w-full rounded"
                    onChange={handleChange}
                  >
                    <option value="">Chọn giờ</option>
                    {availableSlots?.availableSlots?.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {availableSlots.length === 0 && form.date && (
                    <p className="text-xs text-red-500 mt-1">
                      Ngày này không có slot trống
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading
                  ? "Đang xử lý..."
                  : isEditMode
                    ? "Cập nhật lịch"
                    : "Tạo lịch"}
              </button>

              <button
                onClick={() => navigate("/admin/appointments")}
                className="w-full border py-3 rounded hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageAppointment;
