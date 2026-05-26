import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { getReceptionistCustomerDetail } from "../../api/receptionistService";

const RO_STATUS = {
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang sửa",
  PENDING: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export default function CustomerDetail() {
  const { id } = useParams();
  const { data: customer, isLoading } = useQuery({
    queryKey: ["receptionist-customer", id],
    queryFn: () => getReceptionistCustomerDetail(id),
  });

  if (isLoading) return <p className="p-6">Đang tải...</p>;
  if (!customer) return <p className="p-6">Không tìm thấy khách hàng</p>;

  return (
    <div className="bg-[#fbf9f8] min-h-full space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold">{customer.customerName}</h1>
          <p className="text-sm text-zinc-500">
            #{customer.id} · {customer.phone}
          </p>
        </div>
        <Link
          to="/receptionist/customers"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Danh sách
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Thông tin</h3>
          <p className="text-sm">
            <b>Địa chỉ:</b> {customer.address || "—"}
          </p>
          <p className="text-sm">
            <b>Tổng chi tiêu:</b>{" "}
            <span className="text-red-700 font-semibold">
              {Number(customer.totalSpent ?? 0).toLocaleString("vi-VN")}đ
            </span>
          </p>
          <p className="text-sm">
            <b>Tham gia:</b>{" "}
            {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Xe sở hữu ({customer.vehicles?.length || 0})</h3>
          {customer.vehicles?.length === 0 ? (
            <p className="text-sm text-zinc-400">Chưa có xe</p>
          ) : (
            <ul className="text-sm space-y-1">
              {customer.vehicles?.map((v) => (
                <li key={v.id} className="flex justify-between">
                  <span>
                    {v.licensePlate} · {v.brand} {v.model || ""}
                  </span>
                  <Link
                    to={`/receptionist/vehicles/${v.id}`}
                    className="text-blue-700 text-xs"
                  >
                    Chi tiết
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">
          Lịch hẹn gần đây ({customer.appointments?.length || 0})
        </h3>
        {customer.appointments?.length === 0 ? (
          <p className="text-sm text-zinc-400">Chưa có lịch hẹn</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Thời gian</th>
                <th className="p-2 text-left">Trạng thái</th>
                <th className="p-2 text-left">Triệu chứng</th>
              </tr>
            </thead>
            <tbody>
              {customer.appointments?.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">
                    {new Date(a.appointmentTime).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-2 text-xs">{a.status}</td>
                  <td className="p-2 text-xs">{a.symptoms || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">
          Phiếu sửa chữa ({customer.repairOrders?.length || 0})
        </h3>
        {customer.repairOrders?.length === 0 ? (
          <p className="text-sm text-zinc-400">Chưa có phiếu sửa chữa</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Xe</th>
                <th className="p-2 text-left">Trạng thái</th>
                <th className="p-2 text-right">Tổng tiền</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {customer.repairOrders?.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-2 font-bold">#{o.id}</td>
                  <td className="p-2 text-xs">
                    {o.vehicle?.licensePlate} · {o.vehicle?.brand}
                  </td>
                  <td className="p-2 text-xs">
                    {RO_STATUS[o.status] || o.status}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="p-2 text-right">
                    <Link
                      to={`/receptionist/repair-orders/${o.id}`}
                      className="text-blue-700 text-xs"
                    >
                      Xem
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
