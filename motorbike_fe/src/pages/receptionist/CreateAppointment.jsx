import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  createReceptionistAppointment,
  getReceptionistCustomers,
  getReceptionistTechnicians,
} from "../../api/receptionistService";
import { useNotification } from "../../components/Notification";

export default function CreateAppointment() {
  const navigate = useNavigate();
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const [phoneSearch, setPhoneSearch] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getReceptionistTechnicians,
  });

  const searchCustomer = async () => {
    if (!phoneSearch.trim()) return;
    try {
      const list = await getReceptionistCustomers(phoneSearch.trim());
      if (list.length === 0) {
        notify.warning("Không tìm thấy khách. Hãy nhập tên + tạo nhanh ở dưới.");
        setCustomerId(null);
        setVehicles([]);
        return;
      }
      const c = list[0];
      setCustomerId(c.id);
      // load vehicles
      try {
        const res = await api.get(`/vehicles/by-customer?customerId=${c.id}`);
        setVehicles(res.data || []);
      } catch {
        setVehicles([]);
      }
      notify.success(`Đã tìm thấy: ${c.customerName}`);
    } catch (e) {
      notify.error(e.response?.data?.message || "Lỗi tìm khách");
    }
  };

  const submitM = useMutation({
    mutationFn: createReceptionistAppointment,
    onSuccess: () => {
      notify.success("Tạo lịch hẹn thành công");
      setTimeout(() => navigate("/receptionist/appointments"), 800);
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi tạo lịch"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      notify.error("Vui lòng tìm khách hàng trước");
      return;
    }
    if (!appointmentTime) {
      notify.error("Vui lòng chọn thời gian hẹn");
      return;
    }
    submitM.mutate({
      customerId,
      vehicleId: vehicleId ? Number(vehicleId) : null,
      technicianId: technicianId ? Number(technicianId) : null,
      appointmentTime,
      symptoms: symptoms || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      <h1 className="text-xl font-bold mb-6">Tạo lịch hẹn mới</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded p-6 max-w-3xl space-y-4">
        <div>
          <label className="text-sm font-semibold text-zinc-700">Tìm khách theo SĐT</label>
          <div className="flex gap-2 mt-1">
            <input
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="Nhập SĐT"
              className="border p-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={searchCustomer}
              className="bg-zinc-800 text-white px-4 rounded"
            >
              Tìm
            </button>
          </div>
          {customerId && (
            <p className="text-xs text-emerald-600 mt-1">✓ Khách hàng #{customerId}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-zinc-700">Xe</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} · {v.brand} {v.model || ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-zinc-700">Kỹ thuật viên</label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="">-- Chưa phân công --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullname}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-700">Thời gian hẹn *</label>
          <input
            type="datetime-local"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            className="border p-2 rounded w-full mt-1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-700">Triệu chứng</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="border p-2 rounded w-full mt-1"
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-700">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full mt-1"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitM.isPending}
            className="bg-red-700 text-white px-4 py-2 rounded disabled:bg-red-400"
          >
            {submitM.isPending ? "Đang lưu..." : "Tạo lịch hẹn"}
          </button>
        </div>
      </form>
    </div>
  );
}
