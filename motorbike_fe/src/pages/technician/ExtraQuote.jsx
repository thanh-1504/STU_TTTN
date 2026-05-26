import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTechnicianOrderDetail,
  requestExtraQuote,
} from "../../api/technicianService";
import { getServices } from "../../api/servicesService";
import { getSpareParts } from "../../api/sparePartsService";
import { useNotification } from "../../components/Notification";

export default function ExtraQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const [reason, setReason] = useState("");
  const [extraServices, setExtraServices] = useState([]);
  const [extraItems, setExtraItems] = useState([]);

  const { data: order } = useQuery({
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

  const submitM = useMutation({
    mutationFn: (payload) => requestExtraQuote(id, payload),
    onSuccess: () => {
      notify.success("Đã gửi yêu cầu báo giá phát sinh");
      setTimeout(() => navigate(`/technician/orders/${id}`), 800);
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi gửi"),
  });

  const addService = (s) => {
    if (extraServices.find((x) => x.serviceId === s.id)) return;
    setExtraServices([
      ...extraServices,
      {
        serviceId: s.id,
        appliedPrice: Number(s.priceManual),
        name: s.serviceName,
      },
    ]);
  };
  const addPart = (p) => {
    if (extraItems.find((x) => x.sparePartId === p.id)) return;
    setExtraItems([
      ...extraItems,
      {
        sparePartId: p.id,
        quantity: 1,
        unitPrice: Number(p.sellingPrice),
        name: p.partName,
        stock: p.stockQuantity,
      },
    ]);
  };

  const total =
    extraServices.reduce((s, x) => s + Number(x.appliedPrice), 0) +
    extraItems.reduce((s, x) => s + Number(x.unitPrice) * x.quantity, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      notify.error("Cần nhập lý do");
      return;
    }
    if (extraServices.length === 0 && extraItems.length === 0) {
      notify.error("Phải thêm ít nhất 1 dịch vụ hoặc phụ tùng");
      return;
    }
    submitM.mutate({
      reason,
      services: extraServices.map((s) => ({
        serviceId: s.serviceId,
        appliedPrice: s.appliedPrice,
      })),
      items: extraItems.map((i) => ({
        sparePartId: i.sparePartId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <h1 className="text-xl font-bold mb-2">
        Yêu cầu báo giá phát sinh — Phiếu #{id}
      </h1>
      {order && (
        <p className="text-sm text-zinc-500 mb-6">
          {order.customer?.customerName} · {order.vehicle?.licensePlate}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        <div className="bg-white border rounded p-5">
          <h3 className="font-bold mb-2">Lý do phát sinh *</h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mô tả lý do và phạm vi việc phát sinh..."
            className="border p-2 rounded w-full"
            rows={3}
            required
          />
        </div>

        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold">Dịch vụ phát sinh</h3>
          <select
            onChange={(e) => {
              const s = services.find((x) => x.id === Number(e.target.value));
              if (s) addService(s);
              e.target.value = "";
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">+ Thêm dịch vụ</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceName} — {Number(s.priceManual).toLocaleString("vi-VN")}đ
              </option>
            ))}
          </select>
          {extraServices.length > 0 && (
            <table className="w-full text-sm">
              <tbody>
                {extraServices.map((s, idx) => (
                  <tr key={s.serviceId} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={s.appliedPrice}
                        onChange={(e) => {
                          const n = [...extraServices];
                          n[idx].appliedPrice = Number(e.target.value);
                          setExtraServices(n);
                        }}
                        className="border p-1 rounded w-32 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExtraServices(
                            extraServices.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold">Phụ tùng phát sinh</h3>
          <select
            onChange={(e) => {
              const p = parts.find((x) => x.id === Number(e.target.value));
              if (p) addPart(p);
              e.target.value = "";
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">+ Thêm phụ tùng</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partName} (Tồn: {p.stockQuantity})
              </option>
            ))}
          </select>
          {extraItems.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Tên</th>
                  <th className="p-2 text-center">SL</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {extraItems.map((it, idx) => (
                  <tr key={it.sparePartId} className="border-t">
                    <td className="p-2">{it.name}</td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        max={it.stock}
                        value={it.quantity}
                        onChange={(e) => {
                          const n = [...extraItems];
                          n[idx].quantity = Math.max(1, Number(e.target.value));
                          setExtraItems(n);
                        }}
                        className="border p-1 rounded w-16 text-center"
                      />
                    </td>
                    <td className="p-2 text-right">
                      {(it.unitPrice * it.quantity).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExtraItems(extraItems.filter((_, i) => i !== idx))
                        }
                        className="text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border rounded p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-zinc-500">Tổng phát sinh</p>
            <p className="text-2xl font-bold text-amber-600">
              {total.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitM.isPending}
              className="bg-amber-500 text-white px-6 py-2 rounded disabled:bg-amber-300"
            >
              {submitM.isPending ? "Đang gửi..." : "Gửi duyệt"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
