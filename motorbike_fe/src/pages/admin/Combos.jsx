import {
  Bike,
  CheckCircle2,
  Crown,
  Layers,
  PauseCircle,
  Pencil,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteCombo, getCombos } from "../../api/combosService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const stats = [
  {
    title: "Tổng số combo",
    value: "0",
    desc: "+12% so với tháng trước",
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
    desc: "Cần cập nhật lại giá",
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

export default function AdminCombos() {
  const navigate = useNavigate();
  const { notify, notifications } = useNotification();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

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
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa combo "${combo.comboName}"?`,
    );
    if (!confirmDelete) return;

    setDeleteLoadingId(combo.id);
    try {
      const result = await deleteCombo(combo.id);
      if (result.success) {
        notify.success("Xóa combo thành công");
        // Refresh combos list
        const data = await getCombos();
        setCombos(Array.isArray(data) ? data : []);
      } else {
        notify.error(result.errors?.general || "Xóa combo thất bại");
      }
    } catch (error) {
      console.error("Error deleting combo:", error);
      notify.error("Xóa combo thất bại");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const visibleCombos = combos.filter((combo) => combo.isActive);
  const activeCombos = visibleCombos.length;
  const inactiveCombos = 0;
  const totalVisibleCombos = visibleCombos.length;

  const updatedStats = [
    { ...stats[0], value: totalVisibleCombos.toString() },
    { ...stats[1], value: activeCombos.toString() },
    { ...stats[2], value: inactiveCombos.toString() },
  ];
  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      {/* Main */}
      <div className="flex-1 ">
        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Stats */}
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

          {/* Table */}
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
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-sm text-zinc-500"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : visibleCombos.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-sm text-zinc-500"
                      >
                        Không có combo nào
                      </td>
                    </tr>
                  ) : (
                    visibleCombos.map((item, index) => {
                      const Icon = comboIcons[index % comboIcons.length];
                      const color = comboColors[index % comboColors.length];
                      const discountText = item.discountPct
                        ? `Giảm ${item.discountPct}%`
                        : "Không giảm";

                      return (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-zinc-50 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex gap-3 items-center">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>

                              <div>
                                <p className="font-semibold">
                                  {item.comboName}
                                </p>
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

                          <td className="py-4">
                            {item.isActive ? (
                              <span className=" py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">
                                Đang kinh doanh
                              </span>
                            ) : (
                              <span className=" py-1 rounded-full text-xs bg-zinc-100 text-zinc-600 font-semibold">
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
                                title="Chinh sua combo"
                              >
                                <Pencil className="w-4 h-4 text-zinc-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteCombo(item)}
                                disabled={deleteLoadingId === item.id}
                                className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-60"
                                title="Xoa combo"
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
          </section>
        </main>
      </div>
    </div>
  );
}
