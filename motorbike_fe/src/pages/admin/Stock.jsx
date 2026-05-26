import { Eye, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getImportOrders } from "../../api/sparePartsService";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 10;

export default function AdminStock() {
  const [importOrders, setImportOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getImportOrders();
      setImportOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const stats = [
    {
      title: "Tổng đơn nhập (tháng)",
      value: importOrders.length.toString(),
      trend: "12%",
      up: true,
    },
    {
      title: "Tổng giá trị nhập",
      value: formatCurrency(
        importOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      ),
      trend: "3%",
      up: false,
    },
    {
      title: "Đơn chờ nhập kho",
      value: "0",
      trend: "Phiếu chờ duyệt",
      neutral: true,
    },
  ];

  const totalPages = Math.ceil(importOrders.length / PAGE_SIZE);
  const paginatedOrders = importOrders.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-zinc-900">
      {/* Main */}
      <main className="">
        <div className="mx-auto px-8 py-10">
          {/* Title */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Quản lý nhập kho
              </h2>
            </div>

            <NavLink
              to={"create"}
              className="flex items-center gap-2 rounded-lg bg-red-700 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-red-800"
            >
              Tạo phiếu nhập mới
            </NavLink>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{item.title}</span>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50">
                    <span className="material-symbols-outlined">
                      {item.icon}
                    </span>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{item.value}</p>

                  {item.neutral ? (
                    <span className="text-xs text-zinc-400">{item.trend}</span>
                  ) : (
                    <span
                      className={`flex items-center text-xs font-bold ${
                        item.up ? "text-green-600" : "text-red-600"
                      }`}
                    ></span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterInput
                label="Tìm kiếm mã đơn"
                placeholder="VD: NK-2023-001"
              />
              <FilterSelect
                label="Nhà cung cấp"
                options={[
                  "Tất cả nhà cung cấp",
                  "Yamaha Motor Vietnam",
                  "Honda Spare Parts",
                  "Michelin Tires Co.",
                ]}
              />
              <FilterInput label="Khoảng ngày" type="date" />
              <FilterSelect
                label="Trạng thái"
                options={[
                  "Tất cả trạng thái",
                  "Đã nhập kho",
                  "Chờ xử lý",
                  "Đã hủy",
                ]}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                Đặt lại bộ lọc
              </button>
              <button className="rounded bg-zinc-900 px-6 py-2 text-sm font-bold text-white hover:bg-zinc-800">
                Lọc kết quả
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    {[
                      "Mã đơn",
                      "Nhà cung cấp",
                      "Ngày tạo",
                      "Tổng tiền",
                      "Người tạo",
                      "Trạng thái",
                      "Thao tác",
                    ].map((th, i) => (
                      <th
                        key={i}
                        className={`border-b border-zinc-200 px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-600 ${
                          th === "Tổng tiền" ? "text-right" : ""
                        }`}
                      >
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
                          <Loader className="animate-spin" size={18} />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </td>
                    </tr>
                  ) : importOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-sm text-zinc-500"
                      >
                        Chưa có phiếu nhập kho nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-700">
                          #NK{order.id.toString().padStart(5, "0")}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                          —
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {order.admin?.fullName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge text="Đã nhập kho" color="green" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`view/${order.id}`)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-4">
              <p className="text-xs text-zinc-500">
                Hiển thị{" "}
                <span className="text-zinc-900">
                  {importOrders.length === 0 ? 0 : page * PAGE_SIZE + 1} –{" "}
                  {Math.min((page + 1) * PAGE_SIZE, importOrders.length)}
                </span>{" "}
                trong số{" "}
                <span className="text-zinc-900">{importOrders.length}</span> đơn
                nhập
              </p>

              <Pagination
                pageCount={totalPages}
                currentPage={page}
                onPageChange={({ selected }) => setPage(selected)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Components */

function NavItem({ icon, label, active }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 py-3 text-sm ${
        active
          ? "border-l-4 border-red-600 bg-red-50 px-5 font-bold text-red-700"
          : "px-6 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function IconBtn({ icon }) {
  return (
    <button className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100">
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

function FilterInput({ label, type = "text", placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function FilterSelect({ label, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <select className="w-full rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
        {options.map((item, i) => (
          <option key={i}>{item}</option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ text, color }) {
  const styles = {
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  const dot = {
    green: "bg-green-600",
    orange: "bg-orange-600",
    red: "bg-red-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[color]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[color]}`} />
      {text}
    </span>
  );
}

function PageBtn({ icon, disabled }) {
  return (
    <button
      disabled={disabled}
      className="rounded border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function PageNumber({ children, active }) {
  return (
    <button
      className={`flex h-8 w-8 items-center justify-center rounded text-xs ${
        active
          ? "bg-red-700 font-bold text-white"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}
