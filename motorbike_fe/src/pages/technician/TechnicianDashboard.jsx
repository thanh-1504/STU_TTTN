import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getTechnicianDashboard } from "../../api/technicianService";

function StatCard({ label, value, icon, bg, loading }) {
  return (
    <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${bg}`}
        >
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

export default function TechnicianDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["technician-dashboard"],
    queryFn: getTechnicianDashboard,
    staleTime: 30_000,
  });

  return (
    <div className="text-zinc-900 antialiased min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">Tổng quan KTV</h2>
        <p className="text-zinc-500 text-sm mt-0.5">
          Hôm nay — {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lịch hẹn hôm nay"
          value={data?.todayAppointments ?? 0}
          icon="📅"
          bg="bg-blue-50"
          loading={isLoading}
        />
        <StatCard
          label="Phiếu đang phụ trách"
          value={data?.inProgressOrders ?? 0}
          icon="🔧"
          bg="bg-orange-50"
          loading={isLoading}
        />
        <StatCard
          label="Hoàn thành hôm nay"
          value={data?.completedToday ?? 0}
          icon="✅"
          bg="bg-emerald-50"
          loading={isLoading}
        />
        <StatCard
          label="Lịch hẹn sắp tới"
          value={data?.upcomingAppointments?.length ?? 0}
          icon="🕒"
          bg="bg-purple-50"
          loading={isLoading}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h4 className="text-base font-bold text-zinc-900">
            Lịch hẹn sắp tới
          </h4>
          <Link
            to="/technician/tasks"
            className="text-xs text-red-700 font-semibold hover:underline"
          >
            Xem công việc
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {(data?.upcomingAppointments ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-zinc-400">
              Chưa có lịch hẹn
            </p>
          ) : (
            (data?.upcomingAppointments ?? []).map((a) => (
              <div
                key={a.id}
                className="px-6 py-3 flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {a.customer?.customerName || "—"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {a.customer?.phone || ""} · {a.vehicle?.licensePlate || ""}{" "}
                    {a.vehicle?.brand || ""}
                  </p>
                  {a.symptoms && (
                    <p className="text-xs text-zinc-600 mt-1">
                      <b>Triệu chứng:</b> {a.symptoms}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-700">
                    {new Date(a.appointmentTime).toLocaleString("vi-VN")}
                  </p>
                  <span className="inline-block bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] mt-1">
                    {a.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
