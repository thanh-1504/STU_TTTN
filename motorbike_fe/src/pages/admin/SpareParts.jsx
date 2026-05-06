import { AlertTriangle, Package2, Pencil, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getSpareParts } from "../../api/sparePartsService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}d`;

export default function AdminSpareParts() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const fetchSpareParts = async () => {
    setLoading(true);

    try {
      const data = await getSpareParts({
        search: searchQuery,
        belowMinStock: stockFilter === "low",
      });
      setSpareParts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      notify.error("Khong tai duoc danh sach phu tung");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareParts();
  }, [stockFilter]);

  const displayedParts = useMemo(() => {
    if (stockFilter !== "out") {
      return spareParts;
    }

    const query = searchQuery.trim().toLowerCase();

    return spareParts.filter((item) => {
      const matchesSearch =
        !query ||
        item.partName?.toLowerCase().includes(query) ||
        item.partNumber?.toLowerCase().includes(query);

      return matchesSearch && Number(item.stockQuantity) === 0;
    });
  }, [searchQuery, spareParts, stockFilter]);

  const totalParts = displayedParts.length;
  const lowStockParts = displayedParts.filter(
    (item) => Number(item.stockQuantity) <= Number(item.minStockLevel),
  ).length;
  const totalStockValue = displayedParts.reduce(
    (sum, item) => sum + Number(item.sellingPrice) * Number(item.stockQuantity),
    0,
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchSpareParts();
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-8 text-stone-800">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase">Quản lý kho</h1>
          </div>

          <NavLink
            to="/admin/spare-parts/create"
            className="inline-flex items-center justify-center rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
          >
            Thêm
          </NavLink>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Tổng vật tư"
            value={totalParts.toString()}
            icon={Package2}
          />
          <StatCard
            title="Sắp hết hàng"
            value={lowStockParts.toString()}
            icon={AlertTriangle}
            accent="text-orange-600"
          />
          <StatCard
            title="Tổng giá trị tồn kho"
            value={formatCurrency(totalStockValue)}
            icon={Wallet}
            accent="text-green-600"
          />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-4 md:grid-cols-[1fr_220px_140px]"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm tên phụ tùng..."
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="low">Sắp hết hàng</option>
              <option value="out">Hết hàng</option>
            </select>

            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium hover:bg-stone-100"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3 text-right">Giá bán</th>
                  <th className="px-4 py-3 text-right">Tồn kho</th>
                  <th className="px-4 py-3 text-right">Mức cảnh báo</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : displayedParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Không có phụ tùng nào
                    </td>
                  </tr>
                ) : (
                  displayedParts.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-stone-50">
                      <td className="px-4 py-4 font-mono text-xs">
                        {item.partNumber}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {item.partName}
                      </td>
                      <td className="px-4 py-4">{item.unit}</td>
                      <td className="px-4 py-4 text-right">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {Number(item.stockQuantity)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {Number(item.minStockLevel)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge
                          stockQuantity={Number(item.stockQuantity)}
                          minStockLevel={Number(item.minStockLevel)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/spare-parts/edit/${item.id}`)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent = "text-stone-900" }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
        </div>

        <div className="rounded-lg bg-stone-100 p-3">
          <Icon size={18} className="text-stone-600" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ stockQuantity, minStockLevel }) {
  if (stockQuantity === 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Het hang
      </span>
    );
  }

  if (stockQuantity <= minStockLevel) {
    return (
      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
        Sắp hết
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      Còn hàng
    </span>
  );
}
