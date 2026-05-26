import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  assignTechnician,
  getReceptionistAppointments,
  getReceptionistTechnicians,
  rescheduleAppointment,
} from "../../api/receptionistService";
import {
  cancelAdminAppointment,
  confirmAppointment,
} from "../../api/appointmentsService";
import { useNotification } from "../../components/Notification";

const STATUS_LABEL = {
  PENDING: { label: "Chờ xác nhận", badge: "bg-gray-200 text-gray-700" },
  CONFIRMED: { label: "Đã xác nhận", badge: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Đã hủy", badge: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Đã chuyển phiếu", badge: "bg-emerald-100 text-emerald-700" },
};

export default function ReceptionistAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getReceptionistTechnicians,
    staleTime: 5 * 60_000,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["receptionist-appointments", statusFilter, dateFilter, techFilter],
    queryFn: () =>
      getReceptionistAppointments({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        technicianId: techFilter || undefined,
      }),
  });

  const refetch = () =>
    qc.invalidateQueries({ queryKey: ["receptionist-appointments"] });

  const confirmM = useMutation({
    mutationFn: confirmAppointment,
    onSuccess: () => {
      notify.success("Đã xác nhận lịch hẹn");
      refetch();
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi xác nhận"),
  });

  const cancelM = useMutation({
    mutationFn: ({ id, reason }) => cancelAdminAppointment(id, reason),
    onSuccess: () => {
      notify.success("Đã hủy lịch hẹn");
      refetch();
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi hủy"),
  });

  const assignM = useMutation({
    mutationFn: ({ id, technicianId }) => assignTechnician(id, technicianId),
    onSuccess: () => {
      notify.success("Đã phân công kỹ thuật viên");
      refetch();
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi phân công"),
  });

  const rescheduleM = useMutation({
    mutationFn: ({ id, time }) => rescheduleAppointment(id, time),
    onSuccess: () => {
      notify.success("Đã đổi lịch");
      refetch();
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi đổi lịch"),
  });

  const handleAssign = (id) => {
    const techId = prompt("Nhập ID kỹ thuật viên (xem ở dropdown bên trên):");
    if (!techId) return;
    assignM.mutate({ id, technicianId: Number(techId) });
  };

  const handleReschedule = (id) => {
    const t = prompt("Nhập thời gian mới (YYYY-MM-DDTHH:mm):");
    if (!t) return;
    rescheduleM.mutate({ id, time: t });
  };

  const handleCancel = (id) => {
    const reason = prompt("Lý do hủy:");
    if (!reason) return;
    cancelM.mutate({ id, reason });
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Quản lý lịch hẹn</h1>
          <p className="text-gray-500 text-sm">Tiếp nhận, xác nhận, phân công KTV</p>
        </div>
        <Link
          to="/receptionist/appointments/create"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          + Tạo lịch hẹn
        </Link>
      </div>

      <div className="bg-white p-4 border rounded mb-6 grid md:grid-cols-4 gap-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="COMPLETED">Đã hoàn thành</option>
        </select>
        <select
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tất cả KTV</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} · {t.fullname}
            </option>
          ))}
        </select>
        <button onClick={refetch} className="border rounded p-2 hover:bg-gray-50">
          Làm mới
        </button>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            <p>Đang tải...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Không có lịch hẹn</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Khách</th>
                <th className="p-3 text-left">SĐT</th>
                <th className="p-3 text-left">Xe</th>
                <th className="p-3 text-left">Thời gian</th>
                <th className="p-3 text-left">KTV</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const s = STATUS_LABEL[a.status] || { label: a.status, badge: "bg-gray-100" };
                return (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{a.customer?.customerName || "—"}</td>
                    <td className="p-3">{a.customer?.phone || "—"}</td>
                    <td className="p-3">
                      <div>{a.vehicle?.brand || "—"} {a.vehicle?.model || ""}</div>
                      <div className="text-xs text-gray-500">{a.vehicle?.licensePlate || ""}</div>
                    </td>
                    <td className="p-3">
                      {new Date(a.appointmentTime).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 text-xs">{a.technician?.fullname || "Chưa phân công"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.badge}`}>{s.label}</span>
                    </td>
                    <td className="p-3 space-x-2 text-xs">
                      {a.status === "PENDING" && (
                        <button onClick={() => confirmM.mutate(a.id)} className="text-green-700 font-semibold">
                          ✔ Xác nhận
                        </button>
                      )}
                      {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                        <>
                          <button onClick={() => handleAssign(a.id)} className="text-blue-700">
                            👷 Phân công
                          </button>
                          <button onClick={() => handleReschedule(a.id)} className="text-orange-600">
                            🕒 Đổi lịch
                          </button>
                          <button onClick={() => handleCancel(a.id)} className="text-red-600">
                            ✕ Hủy
                          </button>
                        </>
                      )}
                      {a.status === "CONFIRMED" && (
                        <Link
                          to={`/receptionist/repair-orders/create?appointmentId=${a.id}`}
                          className="text-red-700 font-semibold"
                        >
                          📝 Lập phiếu
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
