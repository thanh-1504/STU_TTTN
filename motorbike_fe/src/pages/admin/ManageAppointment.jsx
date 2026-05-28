import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminAppointment,
  getAdminAppointmentDetail,
  getAvailableSlots,
  updateAppointment,
} from "../../api/appointmentsService";
import { getServices } from "../../api/servicesService";
import { useNotification } from "../../components/Notification";

const brands = ["Honda", "Yamaha", "Suzuki", "Kymco"];

const buildAppointmentTime = (date, time) =>
  new Date(`${date}T${time}:00`).toISOString();

const buildNotes = (note, selectedServices) =>
  [note.trim()]
    .concat(
      selectedServices.length > 0
        ? [`Dịch vụ liên quan: ${selectedServices.join(", ")}`]
        : [],
    )
    .filter(Boolean)
    .join("\n");

const ManageAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
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
    services: [],
    symptoms: "",
    vehicleId: null,
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleService = (serviceName) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter((item) => item !== serviceName)
        : [...prev.services, serviceName],
    }));
  };

  const fetchAvailableSlots = useCallback(
    async (date) => {
      if (!date) {
        setAvailableSlots([]);
        return;
      }

      try {
        const response = await getAvailableSlots(date);
        setAvailableSlots(response?.availableSlots || []);
      } catch (error) {
        setAvailableSlots([]);
        notify.error("Lỗi tải slot giờ");
        console.error(error);
      }
    },
    [],
  );

  useEffect(() => {
    if (form.date) {
      fetchAvailableSlots(form.date);
    }
  }, [form.date, fetchAvailableSlots]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await getServices();
        const activeServices = Array.isArray(response)
          ? response.filter((service) => service.isActive).slice(0, 8)
          : [];
        setServiceOptions(activeServices);
      } catch (error) {
        setServiceOptions([]);
        notify.error("Lỗi tải danh sách dịch vụ");
        console.error(error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchAppointmentDetail = async () => {
      try {
        setLoading(true);
        const appointment = await getAdminAppointmentDetail(id);
        const appointmentDate = new Date(appointment.appointmentTime)
          .toISOString()
          .split("T")[0];
        const appointmentTime = new Date(appointment.appointmentTime)
          .toTimeString()
          .slice(0, 5);

        setForm({
          phone: appointment.customer?.phone || "",
          name: appointment.customer?.customerName || "",
          brand: appointment.vehicle?.brand || "",
          model: appointment.vehicle?.model || "",
          plate: appointment.vehicle?.licensePlate || "",
          note: appointment.notes || "",
          date: appointmentDate,
          time: appointmentTime,
          services: [],
          symptoms: appointment.symptoms || "",
          vehicleId: appointment.vehicleId || null,
        });
      } catch (error) {
        notify.error("Lỗi tải chi tiết lịch hẹn");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetail();
  }, [id, isEditMode]);

  const handleSubmit = async () => {
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
      const data = {
        appointmentTime: buildAppointmentTime(form.date, form.time),
        symptoms: form.symptoms.trim() || undefined,
        notes: buildNotes(form.note, form.services) || undefined,
      };

      if (isEditMode) {
        await updateAppointment(id, {
          ...data,
          vehicleId: form.vehicleId || undefined,
        });
        notify.success("Cập nhật lịch hẹn thành công");
      } else {
        await createAdminAppointment({
          ...data,
          phone: form.phone.trim(),
          customerName: form.name.trim(),
          brand: form.brand.trim() || undefined,
          model: form.model.trim() || undefined,
          licensePlate: form.plate.trim() || undefined,
        });
        notify.success("Tạo lịch hẹn thành công");
      }

      setTimeout(() => navigate("/admin/appointments"), 1500);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Lỗi khi tạo hoặc cập nhật lịch hẹn";
      notify.error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
      console.error(error);
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

      <div className="flex-1">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <h1 className="font-bold text-red-700">
            {isEditMode ? "Chỉnh sửa lịch hẹn" : "Tạo lịch hẹn mới"}
          </h1>
        </header>

        <main className="p-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
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
                {servicesLoading && (
                  <p className="text-sm text-gray-500">Đang tải dịch vụ...</p>
                )}

                {!servicesLoading && serviceOptions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Chưa có dịch vụ khả dụng.
                  </p>
                )}

                {!servicesLoading &&
                  serviceOptions.map((service) => (
                    <label
                      key={service.id}
                      className="border p-2 rounded flex gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.services.includes(service.serviceName)}
                        onChange={() => toggleService(service.serviceName)}
                      />
                      {service.serviceName}
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

          <div className="space-y-6">
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
                    {availableSlots.map((slot) => (
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
