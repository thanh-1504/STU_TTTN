import {
  CheckCircle2,
  Clock3,
  Loader,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getVouchers,
  revokeVoucher,
  scanExpiredVouchers,
} from "../../api/vouchersService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";
import Pagination from "../../components/Pagination";
import Swal from "sweetalert2";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}d`;

const formatDate = (value) => new Date(value).toLocaleDateString("vi-VN");

const getDiscountLabel = (voucher) => {
  if (voucher.discountPercent) {
    const maxDiscount = voucher.maxDiscount
      ? ` (toi da ${formatCurrency(voucher.maxDiscount)})`
      : "";
    return `-${voucher.discountPercent}%${maxDiscount}`;
  }

  if (voucher.discountAmount) {
    return `-${formatCurrency(voucher.discountAmount)}`;
  }

  return "-";
};

const PAGE_SIZE = 10;

export default function AdminVouchers() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const fetchVouchers = async () => {
    setLoading(true);

    try {
      const data = await getVouchers(statusFilter);
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      notify.error("Khong tai duoc danh sach khuyen mai");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Quét và cập nhật trạng thái EXPIRED trước khi hiển thị danh sách
    const loadData = async () => {
      const scan = await scanExpiredVouchers();
      if (scan.success && scan.data?.updated > 0) {
        notify.error(
          `Hệ thống đã tự động cập nhật ${scan.data.updated} voucher sang trạng thái Hết hạn.`,
        );
      }
      await fetchVouchers();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const displayedVouchers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      if (!query) {
        return true;
      }

      return (
        voucher.voucherCode?.toLowerCase().includes(query) ||
        voucher.description?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, vouchers]);

  const totalPages = Math.ceil(displayedVouchers.length / PAGE_SIZE);
  const paginatedVouchers = displayedVouchers.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const stats = useMemo(() => {
    const active = vouchers.filter(
      (voucher) => voucher.status === "ACTIVE",
    ).length;
    const expired = vouchers.filter(
      (voucher) => voucher.status === "EXPIRED",
    ).length;
    const revoked = vouchers.filter(
      (voucher) => voucher.status === "REVOKED",
    ).length;

    return [
      {
        title: "Dang hoat dong",
        value: active.toString(),
        icon: CheckCircle2,
        accent: "text-green-600",
      },
      {
        title: "Da het han",
        value: expired.toString(),
        icon: Clock3,
        accent: "text-stone-600",
      },
      {
        title: "Da huy",
        value: revoked.toString(),
        icon: XCircle,
        accent: "text-red-600",
      },
    ];
  }, [vouchers]);

  const handleRevokeVoucher = async (voucher) => {
    const result = await Swal.fire({
      title: "Hủy khuyến mãi?",
      text: `Voucher "${voucher.voucherCode}" sẽ bị hủy và không thể sử dụng nữa.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#78716c",
      confirmButtonText: "Hủy voucher",
      cancelButtonText: "Không",
    });

    if (!result.isConfirmed) return;

    setRevokeLoadingId(voucher.id);

    try {
      const result = await revokeVoucher(voucher.id);

      if (!result.success) {
        notify.error(result.errors?.general || "Huy khuyen mai that bai");
        return;
      }

      notify.success("Da huy khuyen mai");
      await fetchVouchers();
    } catch (error) {
      console.error("Error revoking voucher:", error);
      notify.error("Huy khuyen mai that bai");
    } finally {
      setRevokeLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-8 text-stone-900">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase">Quản lý khuyến mãi</h1>
          </div>

          <NavLink
            to="/admin/vouchers/create"
            className="inline-flex items-center justify-center rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
          >
            Tạo khuyến mãi
          </NavLink>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-xl border bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-stone-500">{item.title}</p>
                    <p className={`mt-2 text-2xl font-bold ${item.accent}`}>
                      {item.value}
                    </p>
                  </div>

                  <div className="rounded-lg bg-stone-100 p-3">
                    <Icon size={18} className="text-stone-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo mã voucher hoặc mô tả..."
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-5 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="REVOKED">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-4 py-3">Mã voucher</th>
                  <th className="px-4 py-3">Loại giảm</th>
                  <th className="px-4 py-3">Giá trị giảm</th>
                  <th className="px-4 py-3 text-right">Đơn tối thiểu</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-stone-500">
                        <Loader className="animate-spin" size={18} />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Không có chương trình khuyến mãi nào
                    </td>
                  </tr>
                ) : (
                  paginatedVouchers.map((voucher) => (
                    <tr key={voucher.id} className="border-t hover:bg-stone-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold">{voucher.voucherCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {voucher.discountPercent
                          ? "Phần trăm"
                          : "Số tiền cố định"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-red-700">
                        {getDiscountLabel(voucher)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {formatCurrency(voucher.minOrderValue)}
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-500">
                        {formatDate(voucher.startDate)} -{" "}
                        {formatDate(voucher.endDate)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={voucher.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/vouchers/edit/${voucher.id}`)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100"
                            title="Chỉnh sửa khuyến mãi"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeVoucher(voucher)}
                            disabled={
                              revokeLoadingId === voucher.id ||
                              voucher.status === "REVOKED" ||
                              voucher.status === "EXPIRED"
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title={
                              voucher.status === "EXPIRED"
                                ? "Voucher đã hết hạn"
                                : voucher.status === "REVOKED"
                                  ? "Voucher đã bị hủy"
                                  : "Hủy khuyến mãi"
                            }
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-stone-500">
              Hiển thị{" "}
              {displayedVouchers.length === 0 ? 0 : page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, displayedVouchers.length)} trên{" "}
              {displayedVouchers.length} khuyến mãi
            </span>
            <Pagination
              pageCount={totalPages}
              currentPage={page}
              onPageChange={({ selected }) => setPage(selected)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    ACTIVE: "bg-green-100 text-green-700",
    EXPIRED: "bg-stone-200 text-stone-700",
    REVOKED: "bg-red-100 text-red-700",
  };

  const label = {
    ACTIVE: "Đang hoạt động",
    EXPIRED: "Đã hết hạn",
    REVOKED: "Đã hủy",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${config[status]}`}
    >
      {label[status] || status}
    </span>
  );
}
