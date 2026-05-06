import { Loader } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  cancelAdminAppointment,
  confirmAppointment,
  getAdminAppointments,
} from "../../api/appointmentsService";
import { useNotification } from "../../components/Notification";

const getStatusUI = (status) => {
  switch (status) {
    case "PENDING":
      return { badge: "bg-gray-200 text-gray-700", label: "Chờ xác nhận" };
    case "CONFIRMED":
      return { badge: "bg-blue-100 text-blue-600", label: "Đã xác nhận" };
    case "CANCELLED":
      return { badge: "bg-red-100 text-red-600", label: "Đã hủy" };
    default:
      return { badge: "bg-gray-100 text-gray-600", label: status };
  }
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminAppointments(
        statusFilter || null,
        dateFilter || null,
      );
      setAppointments(data || []);
    } catch (err) {
      notify.error("Lỗi tải danh sách lịch hẹn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, notify]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleConfirm = async (appointmentId) => {
    try {
      await confirmAppointment(appointmentId);
      notify.success("Đã xác nhận lịch hẹn");
      fetchAppointments();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Lỗi khi xác nhận";
      notify.error(errMsg);
      console.error(err);
    }
  };

  const handleCancel = async (appointmentId) => {
    const reason = prompt("Nhập lý do hủy:");
    if (!reason) return;

    try {
      await cancelAdminAppointment(appointmentId, reason);
      notify.success("Đã hủy lịch hẹn");
      fetchAppointments();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Lỗi khi hủy";
      notify.error(errMsg);
      console.error(err);
    }
  };

  // Filter appointments by search term
  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    const cName = apt.customer?.name || apt.customer?.customerName || "";
    return (
      cName.toLowerCase().includes(searchLower) ||
      apt.customer?.phone?.includes(searchLower) ||
      apt.vehicle?.licensePlate?.toLowerCase().includes(searchLower)
    );
  });
  return (
    <div className="bg-[#fbf9f8] min-h-screen">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* MAIN */}
      <main className="p-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">Quản lý lịch hẹn</h1>
            <p className="text-gray-500 text-sm">
              Quản lý và điều phối lịch hẹn
            </p>
          </div>

          <NavLink
            to="/admin/appointments/create"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            + Tạo lịch hẹn
          </NavLink>
        </div>

        {/* FILTER */}
        <div className="bg-white p-4 border rounded mb-6 grid md:grid-cols-4 gap-4">
          <input
            placeholder="Tên khách, SĐT, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          </select>

          <button
            onClick={fetchAppointments}
            className="border rounded p-2 hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader className="animate-spin mr-2" size={20} />
              <p>Đang tải...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>Không có lịch hẹn nào</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Khách</th>
                    <th className="p-3 text-left">SĐT</th>
                    <th className="p-3 text-left">Xe</th>
                    <th className="p-3 text-left">Triệu chứng</th>
                    <th className="p-3 text-left">Thời gian</th>
                    <th className="p-3 text-left">Trạng thái</th>
                    <th className="p-3 text-left">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((item) => {
                    const appointmentDate = new Date(item.appointmentTime);
                    const dateStr = appointmentDate.toLocaleDateString("vi-VN");
                    const timeStr = appointmentDate.toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );
                    const { badge, label } = getStatusUI(item.status);

                    return (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          {item.customer?.name || item.customer?.customerName || "—"}
                        </td>
                        <td className="p-3">{item.customer?.phone || "—"}</td>

                        <td className="p-3">
                          <div>
                            {item.vehicle
                              ? `${item.vehicle.brand || ""} ${item.vehicle.model || item.vehicle.vehicleType || ""}`.trim() || "—"
                              : "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.vehicle?.licensePlate || ""}
                          </div>
                        </td>

                        <td className="p-3 text-gray-600 max-w-xs truncate">
                          {item.symptoms || "—"}
                        </td>

                        <td className="p-3">
                          <div>{timeStr}</div>
                          <div className="text-xs text-gray-500">{dateStr}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${badge}`}
                          >
                            {label}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            {item.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleConfirm(item.id)}
                                  className="text-green-600 hover:text-green-800 font-bold text-sm"
                                >
                                  ✔ Xác nhận
                                </button>
                                <button
                                  onClick={() => handleCancel(item.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  ✕ Hủy
                                </button>
                              </>
                            )}
                            {item.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Hủy
                              </button>
                            )}
                            <NavLink
                              to={`/admin/appointments/${item.id}/edit`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Sửa
                            </NavLink>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINATION INFO */}
              <div className="flex justify-between p-3 text-sm text-gray-500 border-t">
                <span>
                  Hiển thị {filteredAppointments.length} trên tổng số{" "}
                  {appointments.length} lịch hẹn
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
