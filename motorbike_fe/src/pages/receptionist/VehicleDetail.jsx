import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { getReceptionistVehicleDetail } from "../../api/receptionistService";

const RO_STATUS = {
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang sửa",
  PENDING: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export default function VehicleDetail() {
  const { id } = useParams();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["receptionist-vehicle", id],
    queryFn: () => getReceptionistVehicleDetail(id),
  });

  if (isLoading) return <p className="p-6">Đang tải...</p>;
  if (!vehicle) return <p className="p-6">Không tìm thấy xe</p>;

  return (
    <div className="bg-[#fbf9f8] min-h-full space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold">{vehicle.licensePlate}</h1>
          <p className="text-sm text-zinc-500">
            {vehicle.brand} {vehicle.model || ""} · {vehicle.vehicleType}
          </p>
        </div>
        <Link
          to="/receptionist/vehicles"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Danh sách
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Thông tin xe</h3>
          <p className="text-sm">
            <b>Số khung:</b> {vehicle.vinNumber || "—"}
          </p>
          <p className="text-sm">
            <b>Số máy:</b> {vehicle.engineNumber || "—"}
          </p>
          <p className="text-sm">
            <b>KM hiện tại:</b>{" "}
            {vehicle.currentKm?.toLocaleString("vi-VN") || "—"} km
          </p>
          <p className="text-sm">
            <b>Năm SX:</b> {vehicle.year || "—"}
          </p>
          {vehicle.notes && (
            <p className="text-sm mt-2">
              <b>Ghi chú:</b> {vehicle.notes}
            </p>
          )}
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Chủ xe</h3>
          <p className="text-sm font-semibold">
            {vehicle.customer?.customerName}
          </p>
          <p className="text-sm text-zinc-500">{vehicle.customer?.phone}</p>
          {vehicle.customer?.address && (
            <p className="text-xs text-zinc-500 mt-1">
              {vehicle.customer.address}
            </p>
          )}
          <Link
            to={`/receptionist/customers/${vehicle.customerId}`}
            className="text-blue-700 text-xs mt-2 inline-block"
          >
            Xem hồ sơ KH →
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">
          Lịch sử sửa chữa ({vehicle.repairOrders?.length || 0})
        </h3>
        {vehicle.repairOrders?.length === 0 ? (
          <p className="text-sm text-zinc-400">Chưa có phiếu sửa chữa</p>
        ) : (
          <div className="space-y-3">
            {vehicle.repairOrders?.map((o) => (
              <div
                key={o.id}
                className="border rounded p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link
                      to={`/receptionist/repair-orders/${o.id}`}
                      className="font-bold text-blue-700"
                    >
                      Phiếu #{o.id}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700">
                      {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                    </p>
                    <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                      {RO_STATUS[o.status] || o.status}
                    </span>
                  </div>
                </div>
                {o.services?.length > 0 && (
                  <p className="text-xs text-zinc-600">
                    <b>Dịch vụ:</b>{" "}
                    {o.services.map((s) => s.service?.serviceName).join(", ")}
                  </p>
                )}
                {o.items?.length > 0 && (
                  <p className="text-xs text-zinc-600">
                    <b>Phụ tùng:</b>{" "}
                    {o.items.map((i) => i.sparePart?.partName).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
