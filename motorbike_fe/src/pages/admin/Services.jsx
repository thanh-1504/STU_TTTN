import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getServices,
  removeService,
  updateService,
} from "../../api/servicesService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const PAGE_SIZE = 10;

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}d`;

export default function AdminServices() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Confirm delete dialog
  const [confirmDelete, setConfirmDelete] = useState(null); // service object to delete
  // Warning modal (wasDeactivated)
  const [warningMsg, setWarningMsg] = useState("");

  const fetchServices = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Khong tai duoc danh sach dich vu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.serviceName?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        String(service.id).includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, services, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / PAGE_SIZE),
  );

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedServices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredServices.slice(start, start + PAGE_SIZE);
  }, [filteredServices, page]);

  const handleToggleActive = async (service) => {
    setActionLoadingId(service.id);

    try {
      const result = await updateService(service.id, {
        isActive: !service.isActive,
      });

      if (!result.success) {
        notify.error(result.errors?.general || "Cập nhật trạng thái thất bại");
        return;
      }

      notify.success(
        service.isActive
          ? "Đã ngừng kinh doanh dịch vụ"
          : "Đã kích hoạt lại dịch vụ",
      );
      await fetchServices();
    } catch (err) {
      console.error("Error updating service:", err);
      notify.error("Cập nhật trạng thái thất bại");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = (service) => {
    setConfirmDelete(service);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const service = confirmDelete;
    setConfirmDelete(null);
    setActionLoadingId(service.id);
    try {
      const result = await removeService(service.id);
      if (result?.wasDeactivated) {
        // Backend đã deactivate thay vì xóa
        setWarningMsg(
          result.reason || "Dịch vụ đã được chuyển sang Ngừng kinh doanh.",
        );
        notify.warning?.("Dịch vụ đã được chuyển sang Ngừng kinh doanh") ||
          notify.error("Dịch vụ đã được chuyển sang Ngừng kinh doanh");
      } else {
        notify.success(`Đã xóa dịch vụ "${service.serviceName}" thành công`);
      }
      await fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa dịch vụ thất bại";
      notify.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const startIndex =
    filteredServices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, filteredServices.length);

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-8 text-stone-800">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase">Quản lý dịch vụ</h1>
          </div>

          <div className="flex gap-3">
            {/* <button
              type="button"
              onClick={fetchServices}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Tai lai
            </button> */}

            <NavLink
              to="/admin/services/create"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Thêm dịch vụ mới
            </NavLink>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên dịch vụ, mô tả, ID..."
              className="w-full rounded-lg border border-stone-300 py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Ngừng kinh doanh</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-stone-500">
                Đang tải dữ liệu...
              </div>
            ) : paginatedServices.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-500">
                Không có dịch vụ nào phù hợp
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-100 text-left">
                  <tr>
                    <th className="px-4 py-3">Dịch vụ</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3 text-right">Xe số</th>
                    <th className="px-4 py-3 text-right">Xe ga</th>
                    <th className="px-4 py-3 text-right">PKL</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedServices.map((service) => (
                    <tr key={service.id} className="border-t hover:bg-stone-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-stone-100">
                            {service.imageUrl ? (
                              <img
                                src={service.imageUrl}
                                alt={service.serviceName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-stone-400">
                                Không có ảnh
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold">
                              {service.serviceName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {service.durationMinutes} phút
                      </td>
                      <td className="px-4 py-4 text-right">
                        {formatPrice(service.priceManual)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {formatPrice(service.priceScooter)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {formatPrice(service.priceMoto)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            service.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {service.isActive
                            ? "Đang kinh doanh"
                            : "Ngừng kinh doanh"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/services/edit/${service.id}`)
                            }
                            className="p-2 hover:cursor-pointer hover:bg-zinc-100 rounded-lg"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Pencil className="w-4 h-4 text-zinc-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(service)}
                            disabled={actionLoadingId === service.id}
                            className="inline-flex hover:cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                              service.isActive
                                ? "Ngung kinh doanh"
                                : "Kich hoat lai"
                            }
                          >
                            {service.isActive ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(service)}
                            disabled={actionLoadingId === service.id}
                            className="inline-flex hover:cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-stone-500">
              Hien thi {startIndex}-{endIndex} trong tong so{" "}
              {filteredServices.length} dich vu
            </p>

            <div className="flex gap-2">
              <PageBtn
                icon={<ChevronLeft size={16} />}
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              />
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded border border-red-600 bg-red-600 px-3 text-white">
                {page}
              </span>
              <PageBtn
                icon={<ChevronRight size={16} />}
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Xác nhận xóa dịch vụ
              </h3>
            </div>
            <p className="mb-2 text-sm text-zinc-600">
              Bạn có chắc chắn muốn xóa dịch vụ{" "}
              <span className="font-semibold text-zinc-900">
                &quot;{confirmDelete.serviceName}&quot;
              </span>
              ?
            </p>
            <p className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              ⚠️ Nếu dịch vụ đã xuất hiện trong lịch sử phiếu sửa chữa, hệ thống
              sẽ tự động chuyển sang <strong>Ngừng kinh doanh</strong> thay vì
              xóa vĩnh viễn.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Warning Modal (wasDeactivated) ── */}
      {warningMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <span className="text-xl">⚠️</span>
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Không thể xóa vĩnh viễn
              </h3>
            </div>
            <p className="mb-5 text-sm text-zinc-600">{warningMsg}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setWarningMsg("")}
                className="rounded-lg bg-zinc-800 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ disabled, icon, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
    </button>
  );
}
