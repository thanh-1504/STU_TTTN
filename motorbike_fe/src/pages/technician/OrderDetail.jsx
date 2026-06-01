import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServices } from "../../api/servicesService";
import { getSpareParts } from "../../api/sparePartsService";
import {
  addRepairItem,
  addRepairService,
  completeRepair,
  getTechnicianOrderDetail,
  updateRepairStatus,
  updateVehicleKm,
} from "../../api/technicianService";
import { useNotification } from "../../components/Notification";

const STATUS_OPTS = [
  { value: "IN_PROGRESS", label: "Đang sửa" },
  { value: "PENDING", label: "Tạm dừng (chờ duyệt)" },
];

export default function TechnicianOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const [newPartId, setNewPartId] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [kmInput, setKmInput] = useState("");
  const [techNote, setTechNote] = useState("");
  const [warrantyNote, setWarrantyNote] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["technician-order", id],
    queryFn: () => getTechnicianOrderDetail(id),
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const { data: parts = [] } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: () => getSpareParts(),
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["technician-order", id] });

  const statusM = useMutation({
    mutationFn: (payload) => updateRepairStatus(id, payload),
    onSuccess: () => {
      notify.success("Cập nhật trạng thái");
      refresh();
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi cập nhật"),
  });

  const addItemM = useMutation({
    mutationFn: (payload) => addRepairItem(id, payload),
    onSuccess: () => {
      notify.success("Đã thêm phụ tùng");
      setNewPartId("");
      setNewPartQty(1);
      setNewPartPrice("");
      refresh();
    },
    onError: (e) =>
      notify.error(e.response?.data?.message || "Lỗi thêm phụ tùng"),
  });

  const addServiceM = useMutation({
    mutationFn: (payload) => addRepairService(id, payload),
    onSuccess: () => {
      notify.success("Đã thêm dịch vụ");
      setNewServiceId("");
      setNewServicePrice("");
      refresh();
    },
    onError: (e) =>
      notify.error(e.response?.data?.message || "Lỗi thêm dịch vụ"),
  });

  const kmM = useMutation({
    mutationFn: (km) => updateVehicleKm(id, Number(km)),
    onSuccess: () => {
      notify.success("Cập nhật KM xe");
      setKmInput("");
      refresh();
    },
    onError: (e) =>
      notify.error(e.response?.data?.message || "Lỗi cập nhật KM"),
  });

  const completeM = useMutation({
    mutationFn: (payload) => completeRepair(id, payload),
    onSuccess: () => {
      notify.success("Đã hoàn thành phiếu");
      setShowCompleteModal(false);
      setTimeout(() => navigate("/technician/tasks"), 700);
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi hoàn thành"),
  });

  if (isLoading) return <p className="p-6">Đang tải...</p>;
  if (!order) return <p className="p-6">Không tìm thấy phiếu</p>;

  const isLocked = order.status === "PAID" || order.status === "CANCELLED";

  return (
    <div className="bg-[#fbf9f8] min-h-full space-y-4">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold">Phiếu #{order.id}</h1>
          <p className="text-sm text-zinc-500">
            Tạo: {new Date(order.createdAt).toLocaleString("vi-VN")} · Lễ tân:{" "}
            {order.receptionist?.fullname || "—"}
          </p>
        </div>
        <Link to="/technician/tasks" className="text-sm text-blue-700">
          ← Danh sách
        </Link>
      </div>

      {/* Customer + Vehicle */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Khách hàng</h3>
          <p>{order.customer?.customerName}</p>
          <p className="text-sm text-zinc-500">{order.customer?.phone}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Xe</h3>
          <p>
            {order.vehicle?.brand} {order.vehicle?.model || ""} ·{" "}
            <b>{order.vehicle?.licensePlate}</b>
          </p>
          <p className="text-sm text-zinc-500">
            KM hiện tại: {order.vehicle?.currentKm ?? "—"} km
          </p>
          {!isLocked && (
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={kmInput}
                onChange={(e) => setKmInput(e.target.value)}
                placeholder="KM mới"
                className="border p-1 rounded w-32 text-sm"
              />
              <button
                onClick={() => kmInput && kmM.mutate(kmInput)}
                className="bg-zinc-800 text-white text-xs px-3 rounded"
              >
                Cập nhật
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="bg-white border rounded p-4 flex items-center gap-3">
        <span className="font-semibold text-sm">Trạng thái:</span>
        <span className="px-3 py-1 rounded bg-zinc-100 text-sm font-bold">
          {order.status}
        </span>
        {!isLocked && order.status !== "COMPLETED" && (
          <>
            {STATUS_OPTS.map((s) => (
              <button
                key={s.value}
                onClick={() => statusM.mutate({ status: s.value })}
                disabled={order.status === s.value}
                className="text-xs border px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                → {s.label}
              </button>
            ))}
            {/* <Link
              to={`/technician/orders/${order.id}/extra-quote`}
              className="text-xs bg-amber-500 text-white px-3 py-1 rounded ml-auto"
            >
              📋 Yêu cầu báo giá phát sinh
            </Link> */}
            <button
              onClick={() => setShowCompleteModal(true)}
              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded"
            >
              Hoàn thành
            </button>
          </>
        )}
      </div>

      {/* Services */}
      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">
          Dịch vụ ({order.services?.length || 0})
        </h3>
        <table className="w-full text-sm mb-3">
          <tbody>
            {order.services?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.service?.serviceName}</td>
                <td className="p-2 text-right">
                  {Number(s.appliedPrice).toLocaleString("vi-VN")}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLocked && (
          <div className="flex gap-2 border-t pt-3">
            <select
              value={newServiceId}
              onChange={(e) => {
                setNewServiceId(e.target.value);
                const s = services.find((x) => x.id === Number(e.target.value));
                if (s) setNewServicePrice(String(s.priceManual));
              }}
              className="border p-2 rounded flex-1 text-sm"
            >
              <option value="">+ Thêm dịch vụ phát sinh</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} —{" "}
                  {Number(s.priceManual).toLocaleString("vi-VN")}đ
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              placeholder="Giá áp dụng"
              className="border p-2 rounded w-36 text-sm"
            />
            <button
              onClick={() =>
                addServiceM.mutate({
                  serviceId: Number(newServiceId),
                  appliedPrice: Number(newServicePrice),
                })
              }
              disabled={!newServiceId || !newServicePrice}
              className="bg-zinc-800 text-white text-sm px-4 rounded disabled:bg-gray-400"
            >
              Thêm
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-3">
          Phụ tùng ({order.items?.length || 0})
        </h3>
        <table className="w-full text-sm mb-3">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-center">SL</th>
              <th className="p-2 text-right">Đơn giá</th>
              <th className="p-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.sparePart?.partName}</td>
                <td className="p-2 text-center">{it.quantity}</td>
                <td className="p-2 text-right">
                  {Number(it.unitPrice).toLocaleString("vi-VN")}đ
                </td>
                <td className="p-2 text-right font-semibold">
                  {(it.unitPrice * it.quantity).toLocaleString("vi-VN")}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLocked && (
          <div className="grid md:grid-cols-4 gap-2 border-t pt-3">
            <select
              value={newPartId}
              onChange={(e) => {
                setNewPartId(e.target.value);
                const p = parts.find((x) => x.id === Number(e.target.value));
                if (p) setNewPartPrice(String(p.sellingPrice));
              }}
              className="border p-2 rounded text-sm md:col-span-2"
            >
              <option value="">+ Thêm phụ tùng phát sinh</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partName} (Tồn: {p.stockQuantity})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={newPartQty}
              onChange={(e) => setNewPartQty(Number(e.target.value))}
              placeholder="SL"
              className="border p-2 rounded text-sm"
            />
            <div className="flex gap-1">
              <input
                type="number"
                value={newPartPrice}
                onChange={(e) => setNewPartPrice(e.target.value)}
                placeholder="Đơn giá"
                className="border p-2 rounded text-sm flex-1"
              />
              <button
                onClick={() =>
                  addItemM.mutate({
                    sparePartId: Number(newPartId),
                    quantity: newPartQty,
                    unitPrice: Number(newPartPrice),
                  })
                }
                disabled={!newPartId || !newPartPrice}
                className="bg-zinc-800 text-white text-sm px-3 rounded disabled:bg-gray-400"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes & Total */}
      <div className="bg-white border rounded p-4">
        <h3 className="font-bold mb-2">Ghi chú</h3>
        {order.symptoms && (
          <p className="text-sm">
            <b>Triệu chứng:</b> {order.symptoms}
          </p>
        )}
        {order.vehicleConditionNote && (
          <p className="text-sm">
            <b>Tình trạng xe:</b> {order.vehicleConditionNote}
          </p>
        )}
        {order.technicianNote && (
          <p className="text-sm">
            <b>Ghi chú KTV:</b> {order.technicianNote}
          </p>
        )}
        {order.warrantyNote && (
          <p className="text-sm">
            <b>Bảo hành:</b> {order.warrantyNote}
          </p>
        )}
      </div>

      <div className="bg-white border rounded p-4 flex justify-between items-center">
        <span className="text-sm text-zinc-500">Tổng tiền</span>
        <span className="text-2xl font-bold text-red-700">
          {Number(order.totalAmount).toLocaleString("vi-VN")}đ
        </span>
      </div>

      {/* Complete modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md w-full space-y-3">
            <h3 className="font-bold text-lg">Hoàn thành phiếu #{order.id}</h3>
            <textarea
              placeholder="Ghi chú kỹ thuật"
              value={techNote}
              onChange={(e) => setTechNote(e.target.value)}
              className="border p-2 rounded w-full text-sm"
              rows={3}
            />
            <textarea
              placeholder="Bảo hành (nếu có)"
              value={warrantyNote}
              onChange={(e) => setWarrantyNote(e.target.value)}
              className="border p-2 rounded w-full text-sm"
              rows={2}
            />
            <textarea
              placeholder="Khuyến nghị cho khách"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="border p-2 rounded w-full text-sm"
              rows={2}
            />
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 border rounded text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  completeM.mutate({
                    technicianNote: techNote || undefined,
                    warrantyNote: warrantyNote || undefined,
                    recommendation: recommendation || undefined,
                  })
                }
                disabled={completeM.isPending}
                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm disabled:bg-emerald-400"
              >
                {completeM.isPending ? "Đang xử lý..." : "Xác nhận hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
