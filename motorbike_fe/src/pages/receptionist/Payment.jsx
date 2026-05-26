import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPaymentInfo,
  getReceptionistRepairOrders,
  getRepairOrderDetail,
  payRepairOrder,
  previewVoucher,
} from "../../api/receptionistService";
import { useNotification } from "../../components/Notification";
import PrintInvoice from "../../components/PrintInvoice";

const METHODS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "QR_CODE", label: "QR Code" },
];

export default function Payment() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const orderId = params.get("orderId");
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [voucherCode, setVoucherCode] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const [voucherPreview, setVoucherPreview] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null); // { invoice, warrantyItems }

  // Phiếu chờ thanh toán
  const { data: completedOrders = [] } = useQuery({
    queryKey: ["completed-orders"],
    queryFn: () => getReceptionistRepairOrders("COMPLETED"),
  });

  const { data: order } = useQuery({
    queryKey: ["repair-order-detail", orderId],
    queryFn: () => getRepairOrderDetail(orderId),
    enabled: !!orderId,
  });

  const { data: paymentInfo } = useQuery({
    queryKey: ["payment-info"],
    queryFn: getPaymentInfo,
    staleTime: 5 * 60_000,
  });

  // Reset state khi đổi phiếu
  useEffect(() => {
    setVoucherCode("");
    setVoucherPreview(null);
    setPaidAmount("");
  }, [orderId]);

  const total = useMemo(() => Number(order?.totalAmount || 0), [order]);
  const finalTotal = voucherPreview ? voucherPreview.finalTotal : total;

  const previewM = useMutation({
    mutationFn: () => previewVoucher(orderId, voucherCode.trim()),
    onSuccess: (data) => {
      setVoucherPreview(data);
      notify.success(
        `Áp dụng voucher: giảm ${Number(data.discount).toLocaleString("vi-VN")}đ`,
      );
    },
    onError: (e) => {
      setVoucherPreview(null);
      notify.error(e.response?.data?.message || "Voucher không hợp lệ");
    },
  });

  const payM = useMutation({
    mutationFn: ({ id, payload }) => payRepairOrder(id, payload),
    onSuccess: (data) => {
      notify.success("Thanh toán thành công");
      qc.invalidateQueries();
      // Lưu payload để in hóa đơn + bảo hành
      setInvoiceData({
        invoice: data.invoice,
        warrantyItems: data.warrantyItems,
      });
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi thanh toán"),
  });

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      setVoucherPreview(null);
      return;
    }
    previewM.mutate();
  };

  const handlePay = () => {
    if (!orderId) {
      notify.error("Chọn 1 phiếu để thanh toán");
      return;
    }
    if (!paidAmount || Number(paidAmount) <= 0) {
      notify.error("Nhập số tiền thanh toán");
      return;
    }
    if (Number(paidAmount) < finalTotal) {
      notify.error(
        `Khách phải trả tối thiểu ${finalTotal.toLocaleString("vi-VN")}đ`,
      );
      return;
    }
    payM.mutate({
      id: orderId,
      payload: {
        paymentMethod,
        paidAmount: Number(paidAmount),
        voucherCode: voucherPreview ? voucherCode.trim() : undefined,
      },
    });
  };

  const closeInvoice = () => {
    setInvoiceData(null);
    setParams({});
  };

  if (invoiceData) {
    return (
      <div className="bg-white min-h-full">
        <div className="max-w-2xl mx-auto p-6">
          <div className="no-print mb-4 flex justify-between gap-2">
            <button
              onClick={closeInvoice}
              className="px-4 py-2 border rounded text-sm"
            >
              ← Đóng
            </button>
            <button
              onClick={() => window.print()}
              className="bg-zinc-800 text-white px-4 py-2 rounded text-sm"
            >
              🖨 In hóa đơn + phiếu bảo hành
            </button>
          </div>
          <PrintInvoice
            invoice={invoiceData.invoice}
            warrantyItems={invoiceData.warrantyItems}
            autoPrint
          />
          <style>{`@media print { .no-print { display: none !important; } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <h1 className="text-xl font-bold mb-6">Thanh toán & Bàn giao</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border rounded p-4">
          <h3 className="font-bold mb-3">Phiếu chờ thanh toán</h3>
          {completedOrders.length === 0 ? (
            <p className="text-sm text-zinc-400">Không có phiếu nào</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {completedOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setParams({ orderId: String(o.id) })}
                  className={`w-full text-left p-3 border rounded text-sm ${
                    String(o.id) === orderId
                      ? "border-red-600 bg-red-50"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <p className="font-bold">Phiếu #{o.id}</p>
                  <p className="text-xs">{o.customer?.customerName}</p>
                  <p className="text-xs text-zinc-500">
                    {o.vehicle?.licensePlate}
                  </p>
                  <p className="text-sm font-semibold text-red-700 mt-1">
                    {Number(o.totalAmount).toLocaleString("vi-VN")}đ
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border rounded p-6">
          {!order ? (
            <p className="text-zinc-400 text-center py-12">
              Chọn 1 phiếu ở danh sách bên trái
            </p>
          ) : (
            <>
              <div className="border-b pb-3 mb-4">
                <h3 className="font-bold text-lg">Phiếu #{order.id}</h3>
                <p className="text-sm">
                  {order.customer?.customerName} · {order.customer?.phone}
                </p>
                <p className="text-sm text-zinc-500">
                  Xe: {order.vehicle?.licensePlate} · {order.vehicle?.brand}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-sm">Dịch vụ:</h4>
                {order.services?.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>{s.service?.serviceName}</span>
                    <span>
                      {Number(s.appliedPrice).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
                <h4 className="font-semibold text-sm mt-3">Phụ tùng:</h4>
                {order.items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span>
                      {it.sparePart?.partName} × {it.quantity}
                    </span>
                    <span>
                      {(it.unitPrice * it.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Tổng cộng:</span>
                  <span>{total.toLocaleString("vi-VN")}đ</span>
                </div>
                {voucherPreview && voucherPreview.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-700">
                    <span>
                      Giảm giá ({voucherPreview.voucher?.voucherCode}):
                    </span>
                    <span>
                      - {Number(voucherPreview.discount).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Phải thu:</span>
                  <span className="text-red-700">
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Voucher */}
              <div className="mt-4">
                <label className="text-sm font-semibold">
                  Mã voucher khách
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value);
                      if (voucherPreview) setVoucherPreview(null);
                    }}
                    placeholder="(không bắt buộc)"
                    className="border p-2 rounded flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={previewM.isPending}
                    className="bg-zinc-800 text-white px-4 rounded disabled:bg-gray-400"
                  >
                    {previewM.isPending ? "..." : "Áp dụng"}
                  </button>
                </div>
              </div>

              {/* Phương thức */}
              <div className="mt-4">
                <label className="text-sm font-semibold block mb-1">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`border rounded p-2 text-sm ${
                        paymentMethod === m.value
                          ? "border-red-600 bg-red-50 text-red-700 font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === "BANK_TRANSFER" && paymentInfo && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="font-semibold text-blue-900 mb-1">
                      Thông tin chuyển khoản
                    </p>
                    <p>
                      <b>Ngân hàng:</b> {paymentInfo.bankName || "—"}
                    </p>
                    <p>
                      <b>Số TK:</b> {paymentInfo.accountNumber || "—"}
                    </p>
                    <p>
                      <b>Chủ TK:</b> {paymentInfo.accountHolder || "—"}
                    </p>
                    {paymentInfo.branch && (
                      <p>
                        <b>Chi nhánh:</b> {paymentInfo.branch}
                      </p>
                    )}
                    <p className="text-xs text-blue-700 mt-1">
                      Nội dung: <b>HD{order.id}</b>
                    </p>
                  </div>
                )}

                {paymentMethod === "QR_CODE" && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-center">
                    {paymentInfo?.qrUrl ? (
                      <img
                        src={paymentInfo.qrUrl}
                        alt="QR thanh toán"
                        className="mx-auto h-44 object-contain"
                      />
                    ) : (
                      <p className="text-sm text-emerald-800">
                        Chưa cấu hình QR. Vào Admin → Cấu hình →{" "}
                        <code>PAYMENT_QR_URL</code>.
                      </p>
                    )}
                    <p className="text-xs text-emerald-800 mt-1">
                      Số tiền: <b>{finalTotal.toLocaleString("vi-VN")}đ</b> · ND:{" "}
                      <b>HD{order.id}</b>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold">
                  Số tiền khách trả *
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={String(finalTotal)}
                  className="border p-2 rounded w-full mt-1"
                />
                <button
                  type="button"
                  onClick={() => setPaidAmount(String(finalTotal))}
                  className="text-xs text-blue-700 mt-1"
                >
                  Đúng số tiền cần thu
                </button>
                {paidAmount && Number(paidAmount) > finalTotal && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Tiền thối:{" "}
                    {(Number(paidAmount) - finalTotal).toLocaleString("vi-VN")}đ
                  </p>
                )}
              </div>

              <button
                onClick={handlePay}
                disabled={payM.isPending}
                className="w-full bg-emerald-600 text-white py-3 rounded font-bold disabled:bg-emerald-400 mt-4"
              >
                {payM.isPending
                  ? "Đang xử lý..."
                  : "💵 Xác nhận thanh toán & xuất hóa đơn"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
