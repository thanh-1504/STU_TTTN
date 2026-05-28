import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createVoucher,
  getVoucherById,
  updateVoucher,
} from "../../api/vouchersService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ManageVoucher() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    voucherCode: "",
    description: "",
    discountType: "percent",
    discountAmount: "",
    discountPercent: "",
    maxDiscount: "",
    minOrderValue: "0",
    startDate: "",
    endDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const fetchVoucher = async () => {
      try {
        const data = await getVoucherById(id);
        const isPercentDiscount = Boolean(data.discountPercent);

        setForm({
          voucherCode: data.voucherCode || "",
          description: data.description || "",
          discountType: isPercentDiscount ? "percent" : "amount",
          discountAmount: data.discountAmount
            ? String(Number(data.discountAmount))
            : "",
          discountPercent: data.discountPercent
            ? String(data.discountPercent)
            : "",
          maxDiscount: data.maxDiscount ? String(Number(data.maxDiscount)) : "",
          minOrderValue: String(Number(data.minOrderValue ?? 0)),
          startDate: toDateInputValue(data.startDate),
          endDate: toDateInputValue(data.endDate),
        });
      } catch (error) {
        console.error("Error fetching voucher:", error);
        notify.error("Khong tai duoc thong tin khuyen mai");
        setTimeout(() => navigate("/admin/vouchers"), 1200);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchVoucher();
  }, [id, isEditMode, navigate]);

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

  const handleDiscountTypeChange = (discountType) => {
    setForm((prev) => ({
      ...prev,
      discountType,
      discountAmount: discountType === "amount" ? prev.discountAmount : "",
      discountPercent: discountType === "percent" ? prev.discountPercent : "",
      maxDiscount: discountType === "percent" ? prev.maxDiscount : "",
    }));

    setFieldErrors((prev) => ({
      ...prev,
      discountAmount: "",
      discountPercent: "",
      maxDiscount: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.voucherCode.trim()) {
      errors.voucherCode = "Ma voucher khong duoc de trong";
    }

    if (form.discountType === "percent") {
      if (!form.discountPercent || Number(form.discountPercent) <= 0) {
        errors.discountPercent = "Phan tram giam phai lon hon 0";
      } else if (Number(form.discountPercent) > 100) {
        errors.discountPercent = "Phan tram giam toi da 100";
      }
    }

    if (form.discountType === "amount") {
      if (!form.discountAmount || Number(form.discountAmount) <= 0) {
        errors.discountAmount = "So tien giam phai lon hon 0";
      }
    }

    if (form.maxDiscount && Number(form.maxDiscount) <= 0) {
      errors.maxDiscount = "Giam toi da phai lon hon 0";
    }

    if (form.minOrderValue === "" || Number(form.minOrderValue) < 0) {
      errors.minOrderValue = "Don toi thieu phai tu 0 tro len";
    }

    if (!form.startDate) {
      errors.startDate = "Ngay bat dau khong duoc de trong";
    }

    if (!form.endDate) {
      errors.endDate = "Ngay ket thuc khong duoc de trong";
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) <= new Date(form.startDate)
    ) {
      errors.endDate = "Ngay ket thuc phai lon hon ngay bat dau";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      voucherCode: form.voucherCode.trim(),
      description: form.description.trim() || undefined,
      minOrderValue: Number(form.minOrderValue || 0),
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (form.discountType === "percent") {
      payload.discountPercent = Number(form.discountPercent);
      payload.discountAmount = null;
      payload.maxDiscount = form.maxDiscount
        ? Number(form.maxDiscount)
        : undefined;
    } else {
      payload.discountAmount = Number(form.discountAmount);
      payload.discountPercent = null;
      payload.maxDiscount = null;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      notify.error("Vui long kiem tra lai du lieu bat buoc");
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const payload = buildPayload();
      const result = isEditMode
        ? await updateVoucher(id, payload)
        : await createVoucher(payload);

      if (!result.success) {
        setFieldErrors(result.errors || {});
        notify.error(
          result.errors?.general ||
            (isEditMode
              ? "Cap nhat khuyen mai that bai"
              : "Tao khuyen mai that bai"),
        );
        return;
      }

      notify.success(
        isEditMode
          ? "Cap nhat khuyen mai thanh cong"
          : "Tao khuyen mai thanh cong",
      );

      setTimeout(() => {
        navigate("/admin/vouchers");
      }, 1000);
    } catch (error) {
      console.error("Error saving voucher:", error);
      notify.error("Co loi xay ra trong qua trinh xu ly khuyen mai");
    } finally {
      setLoading(false);
    }
  };

  const previewDiscount = useMemo(() => {
    if (form.discountType === "percent") {
      return form.discountPercent ? `Giam ${form.discountPercent}%` : "Giam %";
    }

    return form.discountAmount
      ? `Giam ${Number(form.discountAmount).toLocaleString("vi-VN")}d`
      : "Giam so tien";
  }, [form.discountAmount, form.discountPercent, form.discountType]);

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-8 text-stone-900">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase">
              {isEditMode ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/vouchers")}
              disabled={loading}
              className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="manage-voucher-form"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:bg-red-400"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {isEditMode ? "Lưu thay đổi" : "Lưu"}
            </button>
          </div>
        </div>

        {initialLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-white">
            <LoaderCircle size={28} className="animate-spin text-red-700" />
          </div>
        ) : (
          <form
            id="manage-voucher-form"
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-6">
              <Section title="Thông tin cơ bản">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Mã voucher *"
                    name="voucherCode"
                    value={form.voucherCode}
                    onChange={handleChange}
                    error={fieldErrors.voucherCode}
                    placeholder="SALE2026"
                  />

                  <FormField
                    label="Đơn tối thiểu"
                    name="minOrderValue"
                    type="number"
                    value={form.minOrderValue}
                    onChange={handleChange}
                    error={fieldErrors.minOrderValue}
                    min="0"
                  />

                  <FormField
                    label="Mô tả"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    error={fieldErrors.description}
                    placeholder="Khuyến mãi cho đơn bảo dưỡng"
                    as="textarea"
                    rows={4}
                    className="md:col-span-2"
                  />
                </div>
              </Section>

              <Section title="Mức ưu đãi">
                <div className="grid gap-4 md:grid-cols-2">
                  <DiscountCard
                    active={form.discountType === "percent"}
                    title="Giảm theo phần trăm"
                    description="Sử dụng trường discountPercent"
                    onClick={() => handleDiscountTypeChange("percent")}
                  />
                  <DiscountCard
                    active={form.discountType === "amount"}
                    title="Giảm theo số tiền"
                    description="Sử dụng trường discountAmount"
                    onClick={() => handleDiscountTypeChange("amount")}
                  />
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {form.discountType === "percent" ? (
                    <>
                      <FormField
                        label="Phần trăm giảm *"
                        name="discountPercent"
                        type="number"
                        value={form.discountPercent}
                        onChange={handleChange}
                        error={fieldErrors.discountPercent}
                        min="1"
                        max="100"
                      />
                      <FormField
                        label="Giảm tối đa"
                        name="maxDiscount"
                        type="number"
                        value={form.maxDiscount}
                        onChange={handleChange}
                        error={fieldErrors.maxDiscount}
                        min="0"
                      />
                    </>
                  ) : (
                    <FormField
                      label="Số tiền giảm *"
                      name="discountAmount"
                      type="number"
                      value={form.discountAmount}
                      onChange={handleChange}
                      error={fieldErrors.discountAmount}
                      min="1"
                      className="md:col-span-2"
                    />
                  )}
                </div>
              </Section>

              <Section title="Thời gian áp dụng">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Ngày bắt đầu *"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    error={fieldErrors.startDate}
                    min={
                      !isEditMode
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                  />
                  <FormField
                    label="Ngày kết thúc *"
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    error={fieldErrors.endDate}
                    min={
                      form.startDate
                        ? new Date(
                            new Date(form.startDate).getTime() + 86400000,
                          )
                            .toISOString()
                            .split("T")[0]
                        : !isEditMode
                          ? new Date().toISOString().split("T")[0]
                          : undefined
                    }
                  />
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Xem nhanh">
                <SummaryRow
                  label="Mã voucher"
                  value={form.voucherCode || "-"}
                />
                <SummaryRow label="Ưu đãi" value={previewDiscount} />
                <SummaryRow
                  label="Đơn tối thiểu"
                  value={`${Number(form.minOrderValue || 0).toLocaleString("vi-VN")}d`}
                />
                <SummaryRow
                  label="Thời gian"
                  value={
                    form.startDate && form.endDate
                      ? `${form.startDate} - ${form.endDate}`
                      : "-"
                  }
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
  as,
  className = "",
  error,
  label,
  name,
  onChange,
  placeholder,
  rows,
  type = "text",
  value,
  ...rest
}) {
  const classNames = `w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 ${
    error ? "border-red-500" : "border-stone-300"
  }`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={classNames}
          {...rest}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={classNames}
          {...rest}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function DiscountCard({ active, description, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left ${
        active
          ? "border-red-500 bg-red-50"
          : "border-stone-200 hover:bg-stone-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${active ? "text-red-700" : "text-stone-800"}`}
      >
        {title}
      </p>
      <p className="mt-1 text-xs text-stone-500">{description}</p>
    </button>
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
