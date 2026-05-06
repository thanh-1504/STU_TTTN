import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function getRangeFor(period) {
  const now = new Date();
  let from, to;
  if (period === "day") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "week") {
    const dow = now.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    from = new Date(now);
    from.setDate(now.getDate() + diff);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  return { from: fmt(from), to: fmt(to) };
}

// Group byDate data for month view (by week)
function groupByWeek(byDate) {
  const weeks = {};
  byDate.forEach((row) => {
    const d = new Date(row.date);
    const weekNum = Math.ceil(d.getDate() / 7);
    const key = `Tuần ${weekNum}`;
    weeks[key] = (weeks[key] || 0) + row.amount;
  });
  return Object.entries(weeks).map(([date, amount]) => ({ date, amount }));
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function buildChartData(byDate, period) {
  if (!byDate || byDate.length === 0) return [];
  if (period === "month") return groupByWeek(byDate);
  if (period === "week") {
    return byDate.map((row) => ({
      ...row,
      date: DAY_LABELS[new Date(row.date).getDay()],
    }));
  }
  // day: show MM-DD
  return byDate.map((row) => ({ ...row, date: row.date.slice(5) }));
}

// Custom Tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-bold mb-0.5">{label}</p>
      <p className="text-red-300">
        {Number(payload[0].value).toLocaleString("vi-VN")}đ
      </p>
    </div>
  );
}

// Stat Card
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Doanh thu & Dịch vụ", "Hiệu suất nhân viên", "Tồn kho & Hàng sắp hết"];
const PERIODS = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState("day");

  const { from, to } = useMemo(() => getRangeFor(period), [period]);

  // API: dashboard summary
  const { data: dashStats, isLoading: loadingDash } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/admin/reports/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  // API: revenue by date range
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: () =>
      api.get(`/admin/reports/revenue?from=${from}&to=${to}`).then((r) => r.data),
    staleTime: 30_000,
  });

  // API: top services
  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["top-services", from, to],
    queryFn: () =>
      api
        .get(`/admin/reports/services?from=${from}&to=${to}&limit=10`)
        .then((r) => r.data),
    staleTime: 30_000,
  });

  // API: inventory
  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.get("/admin/reports/inventory").then((r) => r.data),
    staleTime: 120_000,
  });

  // Derived
  const totalRevenue = revenueData?.totalAmount ?? 0;
  const totalOrders = revenueData?.totalOrders ?? 0;
  const byDate = revenueData?.byDate ?? [];
  const topServices = servicesData?.data ?? [];
  const belowMinStock = inventoryData?.belowMinStock ?? [];
  const chartData = useMemo(() => buildChartData(byDate, period), [byDate, period]);

  const periodLabel = { day: "hôm nay", week: "tuần này", month: "tháng này" }[period];
  const chartTitle = {
    day: "Doanh thu theo ngày",
    week: "Doanh thu theo ngày trong tuần",
    month: "Doanh thu theo tuần trong tháng",
  }[period];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="text-zinc-900 antialiased bg-stone-50 min-h-screen w-full">
      <div className="p-6 xl:p-8 max-w-[1300px] mx-auto">

        {/* Page title + period switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Báo cáo &amp; Thống kê</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Tổng quan hiệu suất kinh doanh —{" "}
              <span className="font-semibold text-red-700">
                {from === to ? from : `${from} → ${to}`}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shadow-sm self-start">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                  period === key
                    ? "bg-red-700 text-white shadow"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Tổng doanh thu"
            value={`${Number(totalRevenue).toLocaleString("vi-VN")}đ`}
            icon="💰"
            bg="bg-emerald-50"
            loading={loadingRevenue}
          />
          <StatCard
            label={`Đơn hàng ${periodLabel}`}
            value={`${totalOrders} đơn`}
            icon="📋"
            bg="bg-orange-50"
            loading={loadingRevenue}
          />
          <StatCard
            label="Lịch hẹn chờ"
            value={dashStats?.pendingAppointments ?? 0}
            icon="📅"
            bg="bg-yellow-50"
            loading={loadingDash}
          />
          <StatCard
            label="Tổng khách hàng"
            value={dashStats?.totalCustomers ?? 0}
            icon="👤"
            bg="bg-blue-50"
            loading={loadingDash}
          />
        </div>

        {/* Tab navigation */}
        <div className="border-b border-zinc-200 mb-6 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`py-3 px-1 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === i
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-zinc-500 hover:text-red-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB 0: Doanh thu & Dịch vụ ───────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: chart + top services */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenue chart */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-base font-bold text-zinc-900">{chartTitle}</h4>
                  {loadingRevenue && (
                    <span className="text-xs text-zinc-400 animate-pulse">Đang tải...</span>
                  )}
                </div>

                {!loadingRevenue && chartData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-zinc-400 text-sm">
                    Không có dữ liệu trong khoảng thời gian này
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f1f1"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(0)}M`
                            : v >= 1_000
                            ? `${(v / 1_000).toFixed(0)}K`
                            : v
                        }
                        width={48}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fef2f2" }} />
                      <Bar
                        dataKey="amount"
                        fill="#b91c1c"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    Tổng doanh thu {periodLabel}
                  </span>
                  <span className="text-lg font-bold text-red-700">
                    {Number(totalRevenue).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Top services table */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="text-base font-bold text-zinc-900">
                    Top dịch vụ bán chạy — {periodLabel}
                  </h4>
                  {loadingServices && (
                    <span className="text-xs text-zinc-400 animate-pulse">Đang tải...</span>
                  )}
                </div>

                {!loadingServices && topServices.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-zinc-400">
                    Không có dữ liệu dịch vụ trong khoảng thời gian này
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider w-10">
                            #
                          </th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            Tên dịch vụ
                          </th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center">
                            Lượt dùng
                          </th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-right">
                            Doanh thu
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {loadingServices
                          ? Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i}>
                                <td colSpan={4} className="px-6 py-4">
                                  <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
                                </td>
                              </tr>
                            ))
                          : topServices.map((svc, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-3 text-sm font-bold text-zinc-400">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-3 text-sm font-medium text-zinc-800">
                                  {svc.serviceName}
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-block bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-xs">
                                    {svc.count}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-zinc-900">
                                  {Number(svc.totalAmount).toLocaleString("vi-VN")}đ
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: inventory warnings */}
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="text-base font-bold text-zinc-900">Cảnh báo tồn kho</h4>
                  {!loadingInventory && belowMinStock.length > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {belowMinStock.length} mặt hàng
                    </span>
                  )}
                </div>

                {loadingInventory ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-zinc-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : belowMinStock.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-emerald-600 font-medium">
                    ✅ Tất cả mặt hàng đều đủ tồn kho
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {belowMinStock.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-red-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">
                            {item.partName}
                          </p>
                          <p className="text-[10px] text-zinc-400">{item.partNumber}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-xs font-black text-red-600">
                            Còn {item.stockQuantity} {item.unit}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Min: {item.minStockLevel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
                  Tổng giá trị tồn kho:{" "}
                  <span className="font-bold text-zinc-800">
                    {Number(inventoryData?.totalValue ?? 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Quick system stats */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
                <h4 className="text-sm font-bold text-zinc-900 mb-3">Tổng quan hệ thống</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                    <span className="text-xs font-medium text-zinc-600">Đang sửa chữa</span>
                    <span className="text-sm font-bold text-orange-600">
                      {loadingDash ? "..." : dashStats?.inProgressOrders ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                    <span className="text-xs font-medium text-zinc-600">Doanh thu all-time</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {loadingDash
                        ? "..."
                        : `${Number(dashStats?.totalRevenue ?? 0).toLocaleString("vi-VN")}đ`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Hiệu suất nhân viên ───────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-3">👷</div>
            <h3 className="text-lg font-bold text-zinc-700 mb-1">Hiệu suất nhân viên</h3>
            <p className="text-zinc-400 text-sm">Tính năng đang được phát triển</p>
          </div>
        )}

        {/* ── TAB 2: Tồn kho & Hàng sắp hết ──────────────────────────────── */}
        {activeTab === 2 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-bold text-zinc-700 mb-1">Tồn kho &amp; Hàng sắp hết</h3>
            <p className="text-zinc-400 text-sm">Tính năng đang được phát triển</p>
          </div>
        )}
      </div>
    </div>
  );
}
