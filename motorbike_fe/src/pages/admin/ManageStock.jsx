import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  createImportOrder,
  getImportOrderById,
  getSpareParts,
} from "../../api/sparePartsService";

export default function ManageStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isViewMode = !!id;

  const [loading, setLoading] = useState(isViewMode);
  const [submitting, setSubmitting] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  const [orderData, setOrderData] = useState(null);

  const [selectedPartId, setSelectedPartId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addPrice, setAddPrice] = useState(0);

  useEffect(() => {
    fetchSpareParts();
    if (isViewMode) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchSpareParts = async () => {
    try {
      const data = await getSpareParts();
      setSpareParts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const data = await getImportOrderById(id);
      setOrderData(data);
      setNotes(data.notes || "");
      setItems(
        data.items.map((item) => ({
          sparePartId: item.sparePartId,
          quantity: item.quantity,
          importPrice: item.importPrice,
          sparePart: item.sparePart,
        })),
      );
    } catch (error) {
      console.error(error);
      alert("Không thể tải thông tin phiếu nhập");
      navigate("/admin/stock");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedPartId || addQty <= 0 || addPrice < 0) {
      alert("Vui lòng chọn phụ tùng và nhập số lượng, giá hợp lệ");
      return;
    }
    const part = spareParts.find((p) => p.id === parseInt(selectedPartId));
    if (!part) return;

    if (items.find((i) => i.sparePartId === part.id)) {
      alert("Phụ tùng này đã có trong danh sách");
      return;
    }

    setItems([
      ...items,
      {
        sparePartId: part.id,
        quantity: parseInt(addQty),
        importPrice: parseInt(addPrice),
        sparePart: part,
      },
    ]);

    setSelectedPartId("");
    setAddQty(1);
    setAddPrice(0);
  };

  const handleRemoveItem = (partId) => {
    setItems(items.filter((i) => i.sparePartId !== partId));
  };

  const updateItemQty = (partId, qty) => {
    setItems(
      items.map((i) =>
        i.sparePartId === partId ? { ...i, quantity: parseInt(qty) || 0 } : i,
      ),
    );
  };

  const updateItemPrice = (partId, price) => {
    setItems(
      items.map((i) =>
        i.sparePartId === partId
          ? { ...i, importPrice: parseInt(price) || 0 }
          : i,
      ),
    );
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.importPrice,
    0,
  );

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Vui lòng thêm ít nhất 1 phụ tùng");
      return;
    }
    setSubmitting(true);
    const payload = {
      notes,
      items: items.map((i) => ({
        sparePartId: i.sparePartId,
        quantity: i.quantity,
        importPrice: i.importPrice,
      })),
    };

    const res = await createImportOrder(payload);
    setSubmitting(false);
    if (res.success) {
      toast.success("Tạo phiếu nhập thành công!");
      navigate("/admin/stock");
    } else {
      alert(res.errors?.general || "Có lỗi xảy ra");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) return <div className="p-8">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-stone-900">
      <main className="min-h-screen p-8">
        <div className="mx-auto ">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {isViewMode
                  ? `Chi tiết phiếu nhập #${id.toString().padStart(5, "0")}`
                  : "Tạo phiếu nhập mới"}
              </h2>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/admin/stock")}
                className="rounded border border-stone-300 bg-white px-6 py-2.5 font-semibold text-stone-600 hover:bg-stone-50"
              >
                Trở lại
              </button>

              {!isViewMode && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded bg-red-700 px-6 py-2.5 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu phiếu nhập"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card title="Thông tin chung">
                <div className="grid grid-cols-2 gap-6">
                  {isViewMode && (
                    <>
                      <Field label="NGÀY NHẬP">
                        <input
                          value={new Date(orderData?.createdAt).toLocaleString(
                            "vi-VN",
                          )}
                          readOnly
                          className="input-disabled w-full rounded border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 outline-none"
                        />
                      </Field>
                      <Field label="NGƯỜI LẬP PHIẾU">
                        <input
                          value={orderData?.admin?.fullName || "—"}
                          readOnly
                          className="input-disabled w-full rounded border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 outline-none"
                        />
                      </Field>
                    </>
                  )}

                  <div className="col-span-2">
                    <Field label="GHI CHÚ">
                      <textarea
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        readOnly={isViewMode}
                        placeholder={isViewMode ? "" : "Nhập ghi chú nếu có..."}
                        className={`w-full rounded border px-3 py-2 text-sm outline-none ${isViewMode ? "border-stone-200 bg-stone-100 text-stone-500" : "border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"}`}
                      />
                    </Field>
                  </div>
                </div>
              </Card>

              <section className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 p-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Danh sách phụ tùng
                    </h3>
                  </div>
                </div>

                {!isViewMode && (
                  <div className="flex items-end gap-4 border-b border-stone-100 bg-stone-50 p-4">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-bold text-stone-500">
                        PHỤ TÙNG
                      </label>
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn phụ tùng --</option>
                        {spareParts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.partNumber} - {p.partName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-xs font-bold text-stone-500">
                        SỐ LƯỢNG
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                        className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-32">
                      <label className="mb-1 block text-xs font-bold text-stone-500">
                        GIÁ NHẬP
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                        className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="rounded bg-stone-800 px-4 py-2 text-sm font-bold text-white hover:bg-stone-900"
                    >
                      Thêm
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-stone-200 bg-stone-50">
                      <tr>
                        {[
                          "PHỤ TÙNG / SKU",
                          "SỐ LƯỢNG",
                          "ĐƠN GIÁ",
                          "THÀNH TIỀN",
                          "",
                        ].map((item, i) => (
                          <th
                            key={i}
                            className="px-6 py-3 text-xs font-bold text-stone-500"
                          >
                            {item}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-stone-100">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-6 text-center text-sm text-stone-500"
                          >
                            Chưa có phụ tùng nào
                          </td>
                        </tr>
                      ) : (
                        items.map((item, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-6 py-4">
                              <p className="font-semibold">
                                {item.sparePart?.partName || "Unknown"}
                              </p>
                              <p className="text-xs text-stone-500">
                                SKU: {item.sparePart?.partNumber}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              {isViewMode ? (
                                <span className="font-medium">
                                  {item.quantity}
                                </span>
                              ) : (
                                <input
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItemQty(
                                      item.sparePartId,
                                      e.target.value,
                                    )
                                  }
                                  type="number"
                                  min="1"
                                  className="w-24 rounded border border-stone-300 py-1 text-center"
                                />
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {isViewMode ? (
                                <span className="font-medium">
                                  {formatCurrency(item.importPrice)}
                                </span>
                              ) : (
                                <input
                                  value={item.importPrice}
                                  onChange={(e) =>
                                    updateItemPrice(
                                      item.sparePartId,
                                      e.target.value,
                                    )
                                  }
                                  type="number"
                                  min="0"
                                  className="w-32 rounded border border-stone-300 py-1 text-right px-2"
                                />
                              )}
                            </td>

                            <td className="px-6 py-4 text-right font-semibold">
                              {formatCurrency(item.quantity * item.importPrice)}
                            </td>

                            <td className="px-6 py-4 text-right">
                              {!isViewMode && (
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.sparePartId)
                                  }
                                  className="text-stone-400 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    delete
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div>
              <section className="sticky top-24 rounded border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-100 bg-stone-50/50 p-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Tổng kết
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <SummaryRow
                    label="Tổng số lượng"
                    value={`${totalQuantity} sản phẩm`}
                  />
                  <SummaryRow
                    label="Tổng tiền hàng"
                    value={formatCurrency(totalAmount)}
                  />

                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">TỔNG THANH TOÁN</span>
                      <div className="text-right">
                        <div className="text-2xl font-black text-red-700">
                          {formatCurrency(totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-6">
                    {!isViewMode && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full rounded bg-red-700 py-3 font-semibold uppercase tracking-wide text-white hover:bg-red-800 disabled:opacity-50"
                      >
                        {submitting ? "Đang lưu..." : "Xác nhận và Lưu phiếu"}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <section className="rounded border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-red-700">{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-stone-500">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={`font-bold ${danger ? "text-red-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}
