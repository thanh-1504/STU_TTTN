import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader,
  UserCheck,
} from "lucide-react";
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
  getAvailableSlots,
} from "../../api/appointmentsService";
import { useNotification } from "../../components/Notification";

const STATUS_LABEL = {
  PENDING: { label: "Chờ xác nhận", badge: "bg-gray-200 text-gray-700" },
  CONFIRMED: { label: "Đã xác nhận", badge: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Đã hủy", badge: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Đã chuyển phiếu", badge: "bg-emerald-100 text-emerald-700" },
};

const iconBtnBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

export default function ReceptionistAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [assignSelections, setAssignSelections] = useState({});
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getReceptionistTechnicians,
    staleTime: 5 * 60_000,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: [
      "receptionist-appointments",
      statusFilter,
      dateFilter,
      techFilter,
      searchFilter,
    ],
    queryFn: () =>
      getReceptionistAppointments({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        technicianId: techFilter || undefined,
        search: searchFilter || undefined,
      }),
  });

  const { data: slotData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["receptionist-available-slots", rescheduleDate],
    queryFn: () => getAvailableSlots(rescheduleDate),
    enabled: Boolean(rescheduleTarget && rescheduleDate),
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
      setRescheduleTarget(null);
      setRescheduleError("");
      refetch();
    },
    onError: (e) => {
      const message = e.response?.data?.message || "Lỗi đổi lịch";
      notify.error(message);
      setRescheduleError(message);
    },
  });

  const availableSlots = slotData?.availableSlots || [];
  const slotOptions =
    rescheduleTime && !availableSlots.includes(rescheduleTime)
      ? [rescheduleTime, ...availableSlots]
      : availableSlots;

  const getSelectedTechId = (appointment) =>
    assignSelections[appointment.id] ??
    (appointment.technician?.id ? String(appointment.technician.id) : "");

  const handleAssign = (appointment) => {
    const selectedTechId = getSelectedTechId(appointment);
    if (!selectedTechId) {
      notify.warning("Vui lòng chọn kỹ thuật viên trước khi phân công");
      return;
    }
    assignM.mutate({
      id: appointment.id,
      technicianId: Number(selectedTechId),
    });
  };

  const openReschedule = (appointment) => {
    const apptDate = new Date(appointment.appointmentTime);
    const dateValue = apptDate.toISOString().slice(0, 10);
    const slotValue = `${String(apptDate.getHours()).padStart(2, "0")}:00`;

    setRescheduleTarget(appointment);
    setRescheduleDate(dateValue);
    setRescheduleTime(slotValue);
    setRescheduleError("");
  };

  const submitReschedule = () => {
    if (!rescheduleTarget) return;
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }

    const originalSlot = rescheduleTarget
      ? `${String(new Date(rescheduleTarget.appointmentTime).getHours()).padStart(2, "0")}:00`
      : "";

    if (
      availableSlots.length > 0 &&
      rescheduleTime !== originalSlot &&
      !availableSlots.includes(rescheduleTime)
    ) {
      setRescheduleError("Vui lòng chọn khung giờ hợp lệ.");
      return;
    }

    // Gửi kèm offset +07:00 để backend nhận đúng giờ VN
    const localIso = `${rescheduleDate}T${rescheduleTime}:00+07:00`;
    rescheduleM.mutate({ id: rescheduleTarget.id, time: localIso });
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

      <div className="bg-white p-4 border rounded mb-6 grid md:grid-cols-5 gap-4">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Tìm tên hoặc SĐT"
          className="border p-2 rounded"
        />
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
                const s = STATUS_LABEL[a.status] || {
                  label: a.status,
                  badge: "bg-gray-100",
                };
                const isAssignable =
                  a.status === "PENDING" || a.status === "CONFIRMED";
                const selectedTechId = getSelectedTechId(a);
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
                    <td className="p-3 text-xs">
                      {isAssignable ? (
                        <select
                          value={selectedTechId}
                          onChange={(e) =>
                            setAssignSelections((prev) => ({
                              ...prev,
                              [a.id]: e.target.value,
                            }))
                          }
                          className="border rounded px-2 py-1 text-xs w-full"
                        >
                          <option value="">-- Chọn KTV --</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullname}
                            </option>
                          ))}
                        </select>
                      ) : (
                        a.technician?.fullname || "Chưa phân công"
                      )}
                    </td>
                    <td className="p-3 min-w-[100px]">
                      <span className={` py-1 rounded text-xs ${s.badge}`}>{s.label}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {a.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => confirmM.mutate(a.id)}
                            title="Xác nhận lịch hẹn"
                            className={`${iconBtnBase} border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {isAssignable && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAssign(a)}
                              title="Phân công kỹ thuật viên"
                              className={`${iconBtnBase} border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100`}
                            >
                              <UserCheck size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openReschedule(a)}
                              title="Đổi lịch hẹn"
                              className={`${iconBtnBase} border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100`}
                            >
                              <Clock size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(a.id)}
                              title="Hủy lịch hẹn"
                              className={`${iconBtnBase} border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100`}
                            >
                              <Ban size={16} />
                            </button>
                          </>
                        )}
                        {a.status === "CONFIRMED" && (
                          <Link
                            to={`/receptionist/repair-orders/create?appointmentId=${a.id}`}
                            title="Lập phiếu sửa chữa"
                            className={`${iconBtnBase} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
                          >
                            <ClipboardList size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                Đổi lịch hẹn #{rescheduleTarget.id}
              </h3>
              <button
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Ngày hẹn
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTime("");
                    setRescheduleError("");
                  }}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Khung giờ
                </label>
                {isLoadingSlots ? (
                  <p className="mt-2 text-sm text-gray-500">Đang tải khung giờ...</p>
                ) : slotOptions.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Không còn khung giờ phù hợp.
                  </p>
                ) : (
                  <select
                    value={rescheduleTime}
                    onChange={(e) => {
                      setRescheduleTime(e.target.value);
                      setRescheduleError("");
                    }}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">-- Chọn khung giờ --</option>
                    {slotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {rescheduleError && (
                <p className="text-sm text-red-600">{rescheduleError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleError("");
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={submitReschedule}
                disabled={rescheduleM.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {rescheduleM.isPending ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
