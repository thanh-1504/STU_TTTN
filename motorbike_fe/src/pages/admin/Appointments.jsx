import {
  Ban,
  CheckCircle2,
  Loader,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  cancelAdminAppointment,
  confirmAppointment,
  getAdminAppointments,
} from "../../api/appointmentsService";
import { useNotification } from "../../components/Notification";
import Pagination from "../../components/Pagination";

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

const iconBtnBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

const PAGE_SIZE = 10;

const AdminAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const goToEditPage = useCallback(
    (appointmentId) => {
      navigate(`/admin/appointments/${appointmentId}/edit`);
    },
    [navigate],
  );

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminAppointments(
        appliedStatus || null,
        appliedDate || null,
      );
      setAppointments(data || []);
    } catch (err) {
      notify.error("Lỗi tải danh sách lịch hẹn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appliedStatus, appliedDate, notify]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setAppliedDate(dateFilter);
    setAppliedStatus(statusFilter);
  };

  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("");
    setStatusFilter("");
    setAppliedSearch("");
    setAppliedDate("");
    setAppliedStatus("");
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await confirmAppointment(appointmentId);
      notify.success("Đã xác nhận lịch hẹn");
      fetchAppointments();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Lỗi khi xác nhận";
      notify.error(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
      console.error(err);
    }
  };

  const handleCancel = async (appointmentId) => {
    const result = await Swal.fire({
      title: "Hủy lịch hẹn",
      input: "textarea",
      inputLabel: "Lý do hủy",
      inputPlaceholder: "Nhập lý do hủy lịch hẹn...",
      inputAttributes: {
        "aria-label": "Lý do hủy lịch hẹn",
      },
      showCancelButton: true,
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Đóng",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      preConfirm: (value) => {
        const reason = value?.trim();
        if (!reason) {
          Swal.showValidationMessage("Vui lòng nhập lý do hủy.");
          return false;
        }
        return reason;
      },
    });

    if (!result.isConfirmed) return;

    try {
      await cancelAdminAppointment(appointmentId, result.value);
      notify.success("Đã hủy lịch hẹn");
      fetchAppointments();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Lỗi khi hủy";
      notify.error(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
      console.error(err);
    }
  };

  const stopRowNavigation = (event) => {
    event.stopPropagation();
  };

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = appliedSearch.toLowerCase();
    if (!searchLower) return true;
    const customerName = apt.customer?.name || apt.customer?.customerName || "";
    return (
      customerName.toLowerCase().includes(searchLower) ||
      apt.customer?.phone?.includes(searchLower) ||
      apt.vehicle?.licensePlate?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);
  const paginatedAppointments = filteredAppointments.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  return (
    <div className="bg-[#fbf9f8] min-h-screen">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <main className="p-4">
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

        <div className="bg-white p-4 border rounded mb-6 grid md:grid-cols-4 gap-4">
          <input
            placeholder="Tên khách, SĐT, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Search size={16} />
              Tìm kiếm
            </button>
            <button
              onClick={handleReset}
              title="Đặt lại bộ lọc"
              className="flex items-center justify-center gap-1 border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg transition-colors"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        <div className="bg-white border rounded overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-sm text-stone-500">
              <Loader className="animate-spin" size={18} />
              <span>Đang tải dữ liệu...</span>
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
                  {paginatedAppointments.map((item) => {
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
                      <tr
                        key={item.id}
                        className="border-t cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => goToEditPage(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            goToEditPage(item.id);
                          }
                        }}
                        tabIndex={0}
                      >
                        <td className="p-3 font-medium">
                          {item.customer?.name ||
                            item.customer?.customerName ||
                            "—"}
                        </td>
                        <td className="p-3">{item.customer?.phone || "—"}</td>

                        <td className="p-3">
                          <div>
                            {item.vehicle
                              ? `${item.vehicle.brand || ""} ${item.vehicle.model || item.vehicle.vehicleType || ""}`.trim() ||
                                "—"
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
                          <div
                            className="flex flex-wrap gap-2"
                            onClick={stopRowNavigation}
                            onKeyDown={stopRowNavigation}
                          >
                            {item.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleConfirm(item.id)}
                                  title="Xác nhận lịch hẹn"
                                  className={`${iconBtnBase} border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100`}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(item.id)}
                                  title="Hủy lịch hẹn"
                                  className={`${iconBtnBase} border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100`}
                                >
                                  <Ban size={16} />
                                </button>
                              </>
                            )}

                            {item.status === "CONFIRMED" && (
                              <button
                                type="button"
                                onClick={() => handleCancel(item.id)}
                                title="Hủy lịch hẹn"
                                className={`${iconBtnBase} border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100`}
                              >
                                <Ban size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => goToEditPage(item.id)}
                              title="Chỉnh sửa lịch hẹn"
                              className="p-2 hover:cursor-pointer hover:bg-zinc-100 rounded-lg"
                            >
                              <Pencil className="w-4 h-4 text-zinc-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-between items-center p-3 text-sm text-gray-500 border-t">
                <span>
                  Hiển thị {filteredAppointments.length === 0 ? 0 : page * PAGE_SIZE + 1}–
                  {Math.min((page + 1) * PAGE_SIZE, filteredAppointments.length)} trên{" "}
                  {filteredAppointments.length} lịch hẹn
                </span>
                <Pagination
                  pageCount={totalPages}
                  currentPage={page}
                  onPageChange={({ selected }) => setPage(selected)}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
