import { useEffect } from "react";

/**
 * Component hóa đơn để in.
 * - Khi `autoPrint=true` sẽ tự bật window.print() khi mount
 * - In ra hai trang: Hóa đơn dịch vụ + Phiếu bảo hành (nếu có)
 */
const PAYMENT_LABEL = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  QR_CODE: "QR Code",
};

export default function PrintInvoice({ invoice, warrantyItems, autoPrint }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 200);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  if (!invoice) return null;

  const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

  return (
    <div className="print-area bg-white text-zinc-900 text-sm">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      {/* Hóa đơn */}
      <div className="page-break">
        <div className="text-center mb-4">
          <h1 className="text-xl font-black uppercase">Shop2Banh</h1>
          <p className="text-xs">Sửa chữa & Bảo dưỡng xe máy</p>
          <h2 className="text-lg font-bold mt-3 uppercase">Hóa đơn dịch vụ</h2>
          <p className="text-xs">Phiếu #{invoice.orderId}</p>
          <p className="text-xs">
            Ngày: {new Date(invoice.paidAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
          <div>
            <p>
              <b>Khách hàng:</b> {invoice.customer?.customerName}
            </p>
            <p>
              <b>SĐT:</b> {invoice.customer?.phone}
            </p>
          </div>
          <div>
            <p>
              <b>Xe:</b> {invoice.vehicle?.licensePlate} ·{" "}
              {invoice.vehicle?.brand}
            </p>
            <p>
              <b>KTV:</b> {invoice.technician?.fullname || "—"}
            </p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-3">
          <thead>
            <tr className="border-y border-zinc-400">
              <th className="p-1 text-left">Hạng mục</th>
              <th className="p-1 text-center">SL</th>
              <th className="p-1 text-right">Đơn giá</th>
              <th className="p-1 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.services?.map((s) => (
              <tr key={`s-${s.id}`} className="border-b border-dashed">
                <td className="p-1">{s.service?.serviceName}</td>
                <td className="p-1 text-center">1</td>
                <td className="p-1 text-right">{fmt(s.appliedPrice)}</td>
                <td className="p-1 text-right">{fmt(s.appliedPrice)}</td>
              </tr>
            ))}
            {invoice.items?.map((it) => (
              <tr key={`i-${it.id}`} className="border-b border-dashed">
                <td className="p-1">{it.sparePart?.partName}</td>
                <td className="p-1 text-center">{it.quantity}</td>
                <td className="p-1 text-right">{fmt(it.unitPrice)}</td>
                <td className="p-1 text-right">
                  {fmt(it.unitPrice * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-xs space-y-1 ml-auto w-64">
          <div className="flex justify-between">
            <span>Tổng tiền:</span>
            <span>{fmt(invoice.totalAmount)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-red-700">
              <span>Giảm giá voucher:</span>
              <span>- {fmt(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Phải thu:</span>
            <span>{fmt(invoice.finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phương thức:</span>
            <span>{PAYMENT_LABEL[invoice.paymentMethod]}</span>
          </div>
          <div className="flex justify-between">
            <span>Khách trả:</span>
            <span>{fmt(invoice.paidAmount)}</span>
          </div>
          {invoice.change > 0 && (
            <div className="flex justify-between">
              <span>Thối lại:</span>
              <span>{fmt(invoice.change)}</span>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6">
          Cảm ơn quý khách. Hẹn gặp lại!
        </p>
      </div>

      {/* Phiếu bảo hành */}
      {warrantyItems?.length > 0 && (
        <div>
          <div className="text-center mb-4 mt-6">
            <h2 className="text-lg font-bold uppercase">Phiếu bảo hành</h2>
            <p className="text-xs">Phiếu #{invoice.orderId}</p>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-y border-zinc-400">
                <th className="p-1 text-left">Phụ tùng</th>
                <th className="p-1 text-center">SL</th>
                <th className="p-1 text-left">Điều kiện bảo hành</th>
              </tr>
            </thead>
            <tbody>
              {warrantyItems.map((w, i) => (
                <tr key={i} className="border-b border-dashed">
                  <td className="p-1">{w.partName}</td>
                  <td className="p-1 text-center">{w.quantity}</td>
                  <td className="p-1">{w.warrantyNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-zinc-500 mt-3">
            Phiếu bảo hành có giá trị khi xuất trình kèm hóa đơn.
          </p>
        </div>
      )}
    </div>
  );
}
