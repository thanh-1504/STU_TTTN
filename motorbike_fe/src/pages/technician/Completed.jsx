import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getTechnicianOrders } from "../../api/technicianService";

const TABS = [
  { key: "COMPLETED", label: "Hoàn thành (chờ thanh toán)" },
  { key: "PAID", label: "Đã thanh toán" },
];

export default function CompletedOrders() {
  const [tab, setTab] = useState("COMPLETED");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["technician-completed", tab],
    queryFn: () => getTechnicianOrders({ status: tab }),
  });

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Phiếu đã hoàn thành</h1>
        <p className="text-gray-500 text-sm">
          Theo dõi các phiếu đã sửa xong và đã thu tiền
        </p>
      </div>

      <div className="bg-white border rounded mb-6 flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold ${
              tab === t.key
                ? "border-b-2 border-red-600 text-red-700"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
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
                <th className="p-3 text-left">Hoàn thành</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-right">Đã thu</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold">#{o.id}</td>
                  <td className="p-3">
                    <p className="font-medium">
                      {o.customer?.customerName || "—"}
                    </p>
                    <p className="text-xs text-gray-500">{o.customer?.phone}</p>
                  </td>
                  <td className="p-3">
                    <p>
                      {o.vehicle?.brand} {o.vehicle?.model || ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.vehicle?.licensePlate}
                    </p>
                  </td>
                  <td className="p-3 text-xs">
                    {new Date(o.updatedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 text-right font-bold text-red-700">
                    {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="p-3 text-right text-emerald-700">
                    {Number(o.paidAmount ?? 0).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/technician/orders/${o.id}`}
                      className="text-blue-700 text-xs"
                    >
                      Xem →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
