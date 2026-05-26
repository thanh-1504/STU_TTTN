import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { getTechnicianOrders } from "../../api/technicianService";

export default function PendingApproval() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["technician-pending"],
    queryFn: () => getTechnicianOrders({ status: "PENDING" }),
  });

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Báo giá phát sinh — chờ duyệt</h1>
        <p className="text-gray-500 text-sm">
          Phiếu của bạn đang chờ lễ tân duyệt báo giá
        </p>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            <p>Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Không có phiếu nào chờ duyệt
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Khách</th>
                <th className="p-3 text-left">Xe</th>
                <th className="p-3 text-right">Tổng tiền</th>
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
                    {o.vehicle?.licensePlate} · {o.vehicle?.brand}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
