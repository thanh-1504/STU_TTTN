import {
  Bike,
  CheckCircle2,
  Crown,
  Layers,
  Loader,
  PauseCircle,
  Pencil,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { deleteCombo, getCombos } from "../../api/combosService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";
import Pagination from "../../components/Pagination";

const stats = [
  {
    title: "Tổng số combo",
    value: "0",
    desc: "Bao gồm cả đang bán và tạm dừng",
    icon: Layers,
    textColor: "group-hover:text-red-600",
  },
  {
    title: "Combo đang chạy",
    value: "0",
    desc: "Đang phục vụ khách hàng",
    icon: CheckCircle2,
    textColor: "group-hover:text-green-600",
  },
  {
    title: "Combo tạm dừng",
    value: "0",
    desc: "Đang ngừng kinh doanh",
    icon: PauseCircle,
    textColor: "group-hover:text-orange-600",
  },
];

const comboIcons = [Bike, Sparkles, Zap, Crown];
const comboColors = [
  "bg-red-50 text-red-600",
  "bg-blue-50 text-blue-600",
  "bg-yellow-50 text-yellow-600",
  "bg-purple-50 text-purple-600",
];

function ComboThumbnail({ combo, index }) {
  const Icon = comboIcons[index % comboIcons.length];
  const color = comboColors[index % comboColors.length];

  if (combo.imageUrl) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        <img
          src={combo.imageUrl}
          alt={combo.comboName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`h-14 w-14 shrink-0 rounded-xl border border-transparent flex items-center justify-center ${color}`}
    >
      <Icon className="h-6 w-6" />
    </div>
  );
}

export default function AdminCombos() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchCombos = async () => {
      setLoading(true);
      try {
        const data = await getCombos();
        setCombos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching combos:", error);
        notify.error("Không tải được danh sách combo");
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, [notify]);

  const handleDeleteCombo = async (combo) => {
    const result = await Swal.fire({
      title: "Xóa combo?",
      text: `Bạn có chắc chắn muốn xóa combo "${combo.comboName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa combo",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setDeleteLoadingId(combo.id);
    try {
      const deleteResult = await deleteCombo(combo.id);
      if (deleteResult.success) {
        setCombos((prev) =>
          prev.map((item) =>
            item.id === combo.id ? { ...item, isActive: false } : item,
          ),
        );
        notify.success("Đã cập nhật combo sang trạng thái tạm dừng");
      } else {
        notify.error(deleteResult.errors?.general || "Xóa combo thất bại");
      }
    } catch (error) {
      console.error("Error deleting combo:", error);
      notify.error("Xóa combo thất bại");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const activeCombos = combos.filter((combo) => combo.isActive).length;
  const inactiveCombos = combos.filter((combo) => !combo.isActive).length;
  const totalCombos = combos.length;

  const updatedStats = [
    { ...stats[0], value: totalCombos.toString() },
    { ...stats[1], value: activeCombos.toString() },
    { ...stats[2], value: inactiveCombos.toString() },
  ];

  const totalPages = Math.ceil(combos.length / PAGE_SIZE);
  const paginatedCombos = combos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="flex-1">
        <main className="p-6 space-y-6">
          <section className="grid md:grid-cols-3 gap-6">
            {updatedStats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group bg-white rounded-2xl border p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">{item.title}</p>
                      <h3
                        className={`text-3xl font-black mt-2 transition ${item.textColor}`}
                      >
                        {item.value}
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-zinc-500" />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 mt-4">{item.desc}</p>
                </div>
              );
            })}
          </section>

          <section className="bg-white rounded-2xl border overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold">Danh sách Gói Combo</h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/admin/combos/create")}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Thêm combo mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left">Tên combo</th>
                    <th className="px-6 py-4 text-left">Dịch vụ bao gồm</th>
                    <th className="px-6 py-4 text-left">Giảm giá</th>
                    <th className="px-6 py-4 text-left">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
                          <Loader className="animate-spin" size={18} />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </td>
                    </tr>
                  ) : combos.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-sm text-zinc-500"
                      >
                        Không có combo nào
                      </td>
                    </tr>
                  ) : (
                    paginatedCombos.map((item, index) => {
                      const discountText = item.discountPct
                        ? `Giảm ${item.discountPct}%`
                        : "Không giảm";

                      return (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-zinc-50 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <ComboThumbnail combo={item} index={index} />

                              <div className="min-w-0">
                                <p className="font-semibold text-zinc-900">
                                  {item.comboName}
                                </p>
                                {item.description && (
                                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {item.services && item.services.length > 0 ? (
                                item.services.map((service) => (
                                  <span
                                    key={service.id}
                                    className="px-2 py-1 rounded-lg bg-zinc-100 text-xs"
                                  >
                                    {service.serviceName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-zinc-400">
                                  Không có dịch vụ
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-red-600">
                            {discountText}
                          </td>

                          <td className="px-6 py-4">
                            {item.isActive ? (
                              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Đang kinh doanh
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                                Tạm dừng
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/admin/combos/edit/${item.id}`)
                                }
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                                title="Chỉnh sửa combo"
                              >
                                <Pencil className="w-4 h-4 text-zinc-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteCombo(item)}
                                disabled={deleteLoadingId === item.id}
                                className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-60"
                                title="Xóa combo"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
              <span className="text-zinc-500">
                Hiển thị {combos.length === 0 ? 0 : page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, combos.length)} trên {combos.length} combo
              </span>
              <Pagination
                pageCount={totalPages}
                currentPage={page}
                onPageChange={({ selected }) => setPage(selected)}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
