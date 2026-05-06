import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSparePart,
  getSparePartById,
  updateSparePart,
} from "../../api/sparePartsService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

export default function ManageSpareParts() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    partNumber: "",
    partName: "",
    unit: "cai",
    stockQuantity: "0",
    minStockLevel: "5",
    sellingPrice: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const fetchSparePart = async () => {
      try {
        const data = await getSparePartById(id);
        setForm({
          partNumber: data.partNumber || "",
          partName: data.partName || "",
          unit: data.unit || "cai",
          stockQuantity: String(data.stockQuantity ?? 0),
          minStockLevel: String(data.minStockLevel ?? 5),
          sellingPrice: String(Number(data.sellingPrice ?? 0)),
        });
      } catch (error) {
        console.error("Error fetching spare part:", error);
        notify.error("Khong tai duoc thong tin phu tung");
        setTimeout(() => navigate("/admin/spare-parts"), 1200);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSparePart();
  }, [id, isEditMode, navigate, notify]);

  const projectedStatus = useMemo(() => {
    const stockQuantity = Number(form.stockQuantity || 0);
    const minStockLevel = Number(form.minStockLevel || 0);

    if (stockQuantity === 0) {
      return "Hết hàng";
    }

    if (stockQuantity <= minStockLevel) {
      return "Sắp hết";
    }

    return "Còn hàng";
  }, [form.minStockLevel, form.stockQuantity]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!isEditMode && !form.partNumber.trim()) {
      errors.partNumber = "Ma phu tung khong duoc de trong";
    }

    if (!form.partName.trim()) {
      errors.partName = "Ten phu tung khong duoc de trong";
    }

    if (!form.unit.trim()) {
      errors.unit = "Don vi khong duoc de trong";
    }

    if (!isEditMode) {
      if (form.stockQuantity === "" || Number(form.stockQuantity) < 0) {
        errors.stockQuantity = "Ton kho phai tu 0 tro len";
      }
    }

    if (form.minStockLevel === "" || Number(form.minStockLevel) < 0) {
      errors.minStockLevel = "Muc canh bao phai tu 0 tro len";
    }

    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) {
      errors.sellingPrice = "Gia ban phai lon hon 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      notify.error("Vui long kiem tra lai cac truong bat buoc");
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      let result;

      if (isEditMode) {
        result = await updateSparePart(id, {
          partName: form.partName.trim(),
          unit: form.unit.trim(),
          minStockLevel: Number(form.minStockLevel),
          sellingPrice: Number(form.sellingPrice),
        });
      } else {
        result = await createSparePart({
          partNumber: form.partNumber.trim(),
          partName: form.partName.trim(),
          unit: form.unit.trim(),
          stockQuantity: Number(form.stockQuantity),
          minStockLevel: Number(form.minStockLevel),
          sellingPrice: Number(form.sellingPrice),
        });
      }

      if (!result.success) {
        setFieldErrors(result.errors || {});
        notify.error(
          result.errors?.general ||
            (isEditMode
              ? "Cap nhat phu tung that bai"
              : "Tao phu tung that bai"),
        );
        return;
      }

      notify.success(
        isEditMode ? "Cap nhat phu tung thanh cong" : "Tao phu tung thanh cong",
      );

      setTimeout(() => {
        navigate("/admin/spare-parts");
      }, 1000);
    } catch (error) {
      console.error("Error saving spare part:", error);
      notify.error("Co loi xay ra trong qua trinh xu ly phu tung");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-8 text-stone-900">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Cập nhật kho" : "Nhập kho"}
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/spare-parts")}
              disabled={loading}
              className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="manage-spare-part-form"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:bg-red-400"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {isEditMode ? "Cập nhật" : "Lưu"}
            </button>
          </div>
        </div>

        {initialLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-white">
            <LoaderCircle size={28} className="animate-spin text-red-700" />
          </div>
        ) : (
          <form
            id="manage-spare-part-form"
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-6">
              <Section title="Thông tin cơ bản">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Mã *"
                    name="partNumber"
                    value={form.partNumber}
                    onChange={handleChange}
                    error={fieldErrors.partNumber}
                    placeholder="PT-001"
                    disabled={isEditMode}
                  />

                  <FormField
                    label="Đơn vị *"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    error={fieldErrors.unit}
                    placeholder="cái"
                  />

                  <FormField
                    label="Tên *"
                    name="partName"
                    value={form.partName}
                    onChange={handleChange}
                    error={fieldErrors.partName}
                    placeholder="Lọc gió Honda"
                    className="md:col-span-2"
                  />
                </div>
              </Section>

              <Section title="Tồn kho và giá bán">
                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    label={
                      isEditMode ? "Tồn kho hiện tại" : "Tồn kho ban đầu *"
                    }
                    name="stockQuantity"
                    type="number"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    error={fieldErrors.stockQuantity}
                    min="0"
                    disabled={isEditMode}
                  />

                  <FormField
                    label="Mức cảnh báo *"
                    name="minStockLevel"
                    type="number"
                    value={form.minStockLevel}
                    onChange={handleChange}
                    error={fieldErrors.minStockLevel}
                    min="0"
                  />

                  <FormField
                    label="Giá bán *"
                    name="sellingPrice"
                    type="number"
                    value={form.sellingPrice}
                    onChange={handleChange}
                    error={fieldErrors.sellingPrice}
                    min="1"
                  />
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Tổng quan">
                <SummaryRow
                  label="Trạng thái tồn kho"
                  value={projectedStatus}
                />
                <SummaryRow label="Mã" value={form.partNumber || "-"} />
                <SummaryRow label="Tồn kho" value={form.stockQuantity || "0"} />
                <SummaryRow
                  label="Giá bán"
                  value={`${Number(form.sellingPrice || 0).toLocaleString("vi-VN")}d`}
                />
              </Section>

              {fieldErrors.general && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {fieldErrors.general}
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FormField({
  className = "",
  disabled = false,
  error,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
  ...rest
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 disabled:bg-stone-100 ${
          error ? "border-red-500" : "border-stone-300"
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 py-3 text-sm last:border-b-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-semibold text-stone-900">{value}</span>
    </div>
  );
}
