import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getTechnicianOrders } from "../../api/technicianService";

const STATUS_LABEL = {
  RECEIVED: { label: "Đã tiếp nhận", badge: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang sửa", badge: "bg-orange-100 text-orange-700" },
  PENDING: { label: "Tạm dừng", badge: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành", badge: "bg-emerald-100 text-emerald-700" },
  PAID: { label: "Đã thanh toán", badge: "bg-zinc-200 text-zinc-700" },
  CANCELLED: { label: "Đã hủy", badge: "bg-red-100 text-red-700" },
};

export default function MyTasks() {
  const [statusFilter, setStatusFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["technician-orders", statusFilter, todayOnly, overdueOnly],
    queryFn: () =>
      getTechnicianOrders({
        status: statusFilter || undefined,
        today: todayOnly,
        overdue: overdueOnly,
      }),
  });

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Công việc được giao</h1>
          <p className="text-gray-500 text-sm">
            Phiếu sửa chữa thuộc trách nhiệm của bạn
          </p>
        </div>
      </div>

      <div className="bg-white p-4 border rounded mb-6 grid md:grid-cols-4 gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="RECEIVED">Đã tiếp nhận</option>
          <option value="IN_PROGRESS">Đang sửa</option>
          <option value="PENDING">Tạm dừng</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={todayOnly}
            onChange={(e) => setTodayOnly(e.target.checked)}
          />
          Chỉ phiếu hôm nay
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Quá hạn (chưa xong)
        </label>
        <button
          onClick={() => {
            setStatusFilter("");
            setTodayOnly(false);
            setOverdueOnly(false);
          }}
          className="border rounded p-2 hover:bg-gray-50"
        >
          Xóa lọc
        </button>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            <p>Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Không có phiếu</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Khách</th>
                <th className="p-3 text-left">Xe</th>
                <th className="p-3 text-left">Dịch vụ</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS_LABEL[o.status] || {
                  label: o.status,
                  badge: "bg-gray-100",
                };
                return (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">#{o.id}</td>
                    <td className="p-3">
                      <p className="font-medium">
                        {o.customer?.customerName || "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {o.customer?.phone}
                      </p>
                    </td>
                    <td className="p-3">
                      <p>
                        {o.vehicle?.brand} {o.vehicle?.model || ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {o.vehicle?.licensePlate}
                      </p>
                    </td>
                    <td className="p-3 text-xs max-w-[280px]">
                      {o.services?.length > 0
                        ? o.services
                            .map((sv) => sv.service?.serviceName)
                            .join(", ")
                        : "—"}
                      <p className="text-zinc-400">
                        {o.items?.length || 0} phụ tùng
                      </p>
                    </td>
                    <td className="p-3 min-w-[100px]">
                      <span className={`py-1 rounded text-xs ${s.badge}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-red-700">
                      {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/technician/orders/${o.id}`}
                        className="text-blue-700 text-xs"
                      >
                        Mở phiếu →
                      </Link>
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
