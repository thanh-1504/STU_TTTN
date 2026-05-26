import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getReceptionistRepairOrders } from "../../api/receptionistService";

const STATUS_LABEL = {
  RECEIVED: { label: "Đã tiếp nhận", badge: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang sửa", badge: "bg-orange-100 text-orange-700" },
  PENDING: { label: "Tạm dừng", badge: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành", badge: "bg-emerald-100 text-emerald-700" },
  PAID: { label: "Đã thanh toán", badge: "bg-zinc-200 text-zinc-700" },
  CANCELLED: { label: "Đã hủy", badge: "bg-red-100 text-red-700" },
};

export default function RepairOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["receptionist-orders", statusFilter],
    queryFn: () => getReceptionistRepairOrders(statusFilter || undefined),
  });

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Tiếp nhận & Phiếu sửa chữa</h1>
          <p className="text-gray-500 text-sm">Lập phiếu, theo dõi tình trạng</p>
        </div>
        <Link
          to="/receptionist/repair-orders/create"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          + Lập phiếu mới
        </Link>
      </div>

      <div className="bg-white p-4 border rounded mb-6">
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
          <option value="PAID">Đã thanh toán</option>
        </select>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            <p>Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Chưa có phiếu</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Khách</th>
                <th className="p-3 text-left">Xe</th>
                <th className="p-3 text-left">KTV</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS_LABEL[o.status] || { label: o.status, badge: "bg-gray-100" };
                return (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">#{o.id}</td>
                    <td className="p-3">
                      <p className="font-medium">{o.customer?.customerName || "—"}</p>
                      <p className="text-xs text-gray-500">{o.customer?.phone}</p>
                    </td>
                    <td className="p-3">
                      <p>{o.vehicle?.brand}</p>
                      <p className="text-xs text-gray-500">{o.vehicle?.licensePlate}</p>
                    </td>
                    <td className="p-3 text-xs">{o.technician?.fullname || "—"}</td>
                    <td className="p-3 text-right font-bold text-red-700">
                      {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.badge}`}>{s.label}</span>
                    </td>
                    <td className="p-3 text-xs">
                      <Link
                        to={`/receptionist/repair-orders/${o.id}`}
                        className="text-blue-700"
                      >
                        Xem chi tiết
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
