import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { getRepairOrderDetail } from "../../api/receptionistService";

const STATUS_LABEL = {
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang sửa",
  PENDING: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export default function RepairOrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["repair-order-detail", id],
    queryFn: () => getRepairOrderDetail(id),
  });

  if (isLoading) return <p className="p-6">Đang tải...</p>;
  if (!order) return <p className="p-6">Không tìm thấy phiếu</p>;

  return (
    <div className="bg-[#fbf9f8] min-h-full space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold">Phiếu #{order.id}</h1>
          <p className="text-sm text-zinc-500">
            Tạo lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <span className="bg-zinc-200 text-zinc-800 px-3 py-1 rounded text-sm font-bold">
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Khách hàng</h3>
          <p>{order.customer?.customerName}</p>
          <p className="text-sm text-zinc-500">{order.customer?.phone}</p>
          {order.customer?.address && (
            <p className="text-xs text-zinc-500 mt-1">{order.customer.address}</p>
          )}
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Xe</h3>
          <p>
            {order.vehicle?.brand} {order.vehicle?.model || ""}
          </p>
          <p className="text-sm text-zinc-500">{order.vehicle?.licensePlate}</p>
          <p className="text-xs text-zinc-500 mt-1">
            Loại: {order.vehicle?.vehicleType} · KM: {order.vehicle?.currentKm ?? "—"}
          </p>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Phụ trách</h3>
          <p>KTV: {order.technician?.fullname}</p>
          <p className="text-sm text-zinc-500">
            Lễ tân: {order.receptionist?.fullname}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">Dịch vụ ({order.services?.length || 0})</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-right">Giá</th>
            </tr>
          </thead>
          <tbody>
            {order.services?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.service?.serviceName}</td>
                <td className="p-2 text-right">
                  {Number(s.appliedPrice).toLocaleString("vi-VN")}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">Phụ tùng ({order.items?.length || 0})</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-center">SL</th>
              <th className="p-2 text-right">Đơn giá</th>
              <th className="p-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.sparePart?.partName}</td>
                <td className="p-2 text-center">{it.quantity}</td>
                <td className="p-2 text-right">
                  {Number(it.unitPrice).toLocaleString("vi-VN")}đ
                </td>
                <td className="p-2 text-right font-semibold">
                  {(it.unitPrice * it.quantity).toLocaleString("vi-VN")}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(order.symptoms || order.vehicleConditionNote || order.technicianNote || order.warrantyNote) && (
        <div className="bg-white border rounded p-4 space-y-2">
          <h3 className="font-bold mb-2">Ghi chú</h3>
          {order.symptoms && (
            <p className="text-sm"><b>Triệu chứng:</b> {order.symptoms}</p>
          )}
          {order.vehicleConditionNote && (
            <p className="text-sm"><b>Tình trạng xe:</b> {order.vehicleConditionNote}</p>
          )}
          {order.technicianNote && (
            <p className="text-sm"><b>Ghi chú KTV:</b> {order.technicianNote}</p>
          )}
          {order.warrantyNote && (
            <p className="text-sm"><b>Bảo hành:</b> {order.warrantyNote}</p>
          )}
        </div>
      )}

      <div className="bg-white border rounded p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-zinc-500">Tổng tiền</p>
          <p className="text-2xl font-bold text-red-700">
            {Number(order.totalAmount).toLocaleString("vi-VN")}đ
          </p>
          {order.paidAmount > 0 && (
            <p className="text-sm text-emerald-700">
              Đã thanh toán: {Number(order.paidAmount).toLocaleString("vi-VN")}đ
            </p>
          )}
        </div>
        {order.status === "COMPLETED" && (
          <Link
            to={`/receptionist/payment?orderId=${order.id}`}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
          >
            💵 Thanh toán
          </Link>
        )}
      </div>
    </div>
  );
}
