import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getReceptionistDashboard } from "../../api/receptionistService";

const STATUS_LABEL = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang sửa",
  PAID: "Đã thanh toán",
};

function StatCard({ label, value, icon, bg, loading }) {
  return (
    <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${bg}`}>
          {icon}
        </div>
      </div>
      <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-zinc-900">
        {loading ? <span className="text-zinc-300 animate-pulse">—</span> : value}
      </p>
    </div>
  );
}

export default function ReceptionistDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["receptionist-dashboard"],
    queryFn: getReceptionistDashboard,
    staleTime: 30_000,
  });

  return (
    <div className="text-zinc-900 antialiased min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">Tổng quan Lễ tân</h2>
        <p className="text-zinc-500 text-sm mt-0.5">
          Hôm nay — {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lịch hẹn hôm nay"
          value={data?.todayAppointments ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="Xe đang sửa"
          value={data?.inProgressOrders ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="Phiếu chờ thanh toán"
          value={data?.pendingPayment ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="Doanh thu hôm nay"
          value={`${Number(data?.todayRevenue ?? 0).toLocaleString("vi-VN")}đ`}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-zinc-900">Lịch hẹn gần nhất</h4>
            <Link to="/receptionist/appointments" className="text-xs text-red-700 font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {(data?.latestAppointments ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-zinc-400">Chưa có lịch hẹn</p>
            ) : (
              (data?.latestAppointments ?? []).map((a) => (
                <div key={a.id} className="px-6 py-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold">{a.customer?.customerName || "—"}</p>
                    <p className="text-xs text-zinc-500">
                      {a.customer?.phone || ""} · {a.vehicle?.licensePlate || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-700">
                      {new Date(a.appointmentTime).toLocaleString("vi-VN")}
                    </p>
                    <span className="inline-block bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] mt-1">
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-zinc-900">Phiếu sửa gần nhất</h4>
            <Link to="/receptionist/repair-orders" className="text-xs text-red-700 font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {(data?.latestOrders ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-zinc-400">Chưa có phiếu sửa chữa</p>
            ) : (
              (data?.latestOrders ?? []).map((o) => (
                <Link
                  key={o.id}
                  to={`/receptionist/repair-orders/${o.id}`}
                  className="px-6 py-3 flex justify-between hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Phiếu #{o.id} · {o.customer?.customerName || "—"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      KTV: {o.technician?.fullname || "—"} · {o.vehicle?.licensePlate || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-700">
                      {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                    </p>
                    <span className="inline-block bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] mt-1">
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}