import { LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCombo,
  getComboById,
  updateCombo,
  uploadComboImage,
} from "../../api/combosService";
import { getServices } from "../../api/servicesService";
import {
  NotificationContainer,
  useNotification,
} from "../../components/Notification";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ManageCombo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    comboName: "",
    description: "",
    discountPct: "",
    isActive: true,
    serviceIds: [],
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [uploading, setUploading] = useState(false);

  const [allServices, setAllServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [tempSelectedServices, setTempSelectedServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setAllServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (isEditMode) {
      const fetchComboData = async () => {
        try {
          const data = await getComboById(id);
          setForm({
            comboName: data.comboName || "",
            description: data.description || "",
            discountPct: data.discountPct || "",
            isActive: data.isActive ?? true,
            serviceIds: data.services?.map((s) => s.id) || [],
          });
          if (data.imageUrl) {
            setImagePreview(data.imageUrl);
          }
          setTempSelectedServices(data.services?.map((s) => s.id) || []);
        } catch (error) {
          console.error("Error fetching combo:", error);
          notify.error("Khong the tai thong tin combo");
          setTimeout(() => navigate("/admin/combos"), 1500);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchComboData();
    }

    fetchServices();
  }, [id, isEditMode, navigate, notify]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Chi ho tro anh JPG, PNG hoac WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      notify.error("Anh vuot qua gioi han 5MB");
      event.target.value = "";
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
  };

  const handleServiceCheckChange = (serviceId, checked) => {
    if (checked) {
      setTempSelectedServices((prev) => [...prev, serviceId]);
    } else {
      setTempSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    }
  };

  const handleAddServices = () => {
    setForm((prev) => ({
      ...prev,
      serviceIds: tempSelectedServices,
    }));
    setOpenServiceModal(false);
  };

  const selectableServices = allServices.filter((service) => service.isActive);

  const selectedServiceObjects = allServices.filter((s) =>
    form.serviceIds.includes(s.id),
  );

  const handleRemoveService = (serviceId) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.filter((id) => id !== serviceId),
    }));
  };

  const filteredServices = selectableServices.filter((service) => {
    const query = serviceFilter.toLowerCase();
    return (
      !query ||
      service.serviceName?.toLowerCase().includes(query) ||
      String(service.id).includes(query)
    );
  });

  const validateForm = () => {
    const errors = {};

    if (!form.comboName.trim()) {
      errors.comboName = "Ten combo khong duoc de trong";
    }

    if (form.serviceIds.length === 0) {
      errors.serviceIds = "Combo phai co it nhat 1 dich vu";
    }

    if (
      form.discountPct &&
      (Number(form.discountPct) < 0 || Number(form.discountPct) > 100)
    ) {
      errors.discountPct = "Phan tram giam phai tu 0 den 100";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      let imageUrl;

      if (selectedImage) {
        setUploading(true);
        const uploadResult = await uploadComboImage(selectedImage);
        imageUrl = uploadResult.imageUrl;
        setUploading(false);
      }

      const payload = {
        comboName: form.comboName.trim(),
        description: form.description.trim() || undefined,
        discountPct: form.discountPct ? Number(form.discountPct) : undefined,
        isActive: form.isActive,
        serviceIds: form.serviceIds,
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      let result;
      if (isEditMode) {
        result = await updateCombo(id, payload);
      } else {
        result = await createCombo(payload);
      }

      if (!result.success) {
        setFieldErrors(result.errors || {});
        notify.error(
          result.errors?.general ||
            (isEditMode ? "Cap nhat combo that bai" : "Tao combo that bai"),
        );
        return;
      }

      notify.success(
        isEditMode ? "Cap nhat combo thanh cong" : "Tao combo thanh cong",
      );

      setTimeout(() => {
        navigate("/admin/combos");
      }, 1200);
    } catch (error) {
      console.error("Error:", error);
      notify.error("Co loi xay ra trong qua trinh xu ly combo");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex text-gray-800 relative">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      {/* Main */}
      <div
        className={`flex-1 flex flex-col min-h-screen p-8 transition ${
          openServiceModal ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold">
            {isEditMode ? "Chỉnh sửa combo" : "Thêm combo mới"}
          </h2>
        </div>

        {/* Content */}
        {initialLoading ? (
          <main className="flex-1 p-8 flex items-center justify-center">
            <LoaderCircle size={32} className="animate-spin text-red-600" />
          </main>
        ) : (
          <main className="flex-1 p-8">
            <form
              id="manage-combo-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-12 gap-8"
            >
              {/* LEFT */}
              <div className="col-span-8 space-y-8">
                {/* Basic Info */}
                <section className="bg-white rounded-xl border p-6">
                  <h3 className="font-bold text-lg mb-6">Thông tin cơ bản</h3>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <FormField
                      label="Tên combo *"
                      name="comboName"
                      value={form.comboName}
                      onChange={handleChange}
                      error={fieldErrors.comboName}
                      placeholder="Combo bảo dưỡng..."
                    />
                  </div>

                  <FormField
                    label="Mô tả combo"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    error={fieldErrors.description}
                    placeholder="Mô tả lợi ích combo..."
                    as="textarea"
                    rows={4}
                  />
                </section>

                {/* Services */}
                <section className="bg-white rounded-xl border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Dịch vụ trong combo *</h3>

                    <button
                      type="button"
                      onClick={() => {
                        setTempSelectedServices(form.serviceIds);
                        setOpenServiceModal(true);
                      }}
                      className="text-blue-600 font-semibold text-sm"
                    >
                      + Thêm dịch vụ
                    </button>
                  </div>

                  {form.serviceIds.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed text-center text-gray-400">
                      Chưa chọn dịch vụ nào. Bấm "Thêm dịch vụ" để thêm.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedServiceObjects.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center p-4 rounded-lg border bg-gray-50"
                        >
                          <div>
                            <p className="font-semibold">
                              {service.serviceName}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveService(service.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {fieldErrors.serviceIds && (
                    <p className="text-xs text-red-600 mt-2">
                      {fieldErrors.serviceIds}
                    </p>
                  )}
                </section>

                {/* Pricing */}
                <section className="bg-white rounded-xl border p-6">
                  <h3 className="font-bold text-lg mb-6">Cấu hình giá</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      label="Phần trăm giảm giá (%)"
                      name="discountPct"
                      value={form.discountPct}
                      onChange={handleChange}
                      error={fieldErrors.discountPct}
                      placeholder="10"
                      type="number"
                      min="0"
                      max="100"
                    />
                  </div>
                </section>
              </div>

              {/* RIGHT */}
              <div className="col-span-4 space-y-8">
                {/* Status */}
                <section className="bg-white rounded-xl border p-6">
                  <h3 className="font-bold text-lg mb-6">Trạng thái</h3>

                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium">Đang bán</span>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 accent-red-600"
                    />
                  </label>
                </section>

                {/* Upload */}
                <section className="bg-white rounded-xl border p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Hình ảnh Combo</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Không bắt buộc. Hỗ trợ JPG, PNG, WEBP tối đa 5MB.
                      </p>
                    </div>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100"
                        title="Xóa ảnh"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <div className="overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview combo"
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-3 px-4 text-center text-stone-500">
                          <div className="rounded-full bg-white p-3 shadow-sm">
                            <Upload size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-700">
                              Chọn ảnh combo
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </section>

                {fieldErrors.general && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                    {fieldErrors.general}
                  </div>
                )}
              </div>
            </form>
          </main>
        )}

        {/* Footer */}
        <footer className="sticky bottom-0 bg-white border-t h-20 px-8 flex justify-end items-center">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/combos")}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
             Hủy bỏ
            </button>

            <button
              type="submit"
              form="manage-combo-form"
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 px-8 py-2 bg-[#B21B00] text-white rounded-lg hover:bg-[#8e1400] disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {(loading || uploading) && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              {uploading
                ? "Đang upload ảnh..."
                : loading
                  ? isEditMode
                    ? "Đang cập nhật..."
                    : "Đang lưu..."
                  : isEditMode
                    ? "Cập nhật combo"
                    : "Lưu combo"}
            </button>
          </div>
        </footer>
      </div>

      {/* MODAL */}
      {openServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-6 h-14 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Chọn dịch vụ vào combo
              </h3>

              <button
                onClick={() => setOpenServiceModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 px-6 py-4 border-b bg-white">
              <input
                type="text"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                placeholder="Tim ten dich vu, ID..."
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#B21B00]"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {selectableServices.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Khong co dich vu nao
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b z-10">
                    <tr className="text-gray-500 uppercase text-[11px]">
                      <th className="px-4 py-3 w-12 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredServices.length > 0 &&
                            filteredServices.every((s) =>
                              tempSelectedServices.includes(s.id),
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempSelectedServices((prev) => [
                                ...new Set([
                                  ...prev,
                                  ...filteredServices.map((s) => s.id),
                                ]),
                              ]);
                            } else {
                              setTempSelectedServices((prev) =>
                                prev.filter(
                                  (id) =>
                                    !filteredServices.find((s) => s.id === id),
                                ),
                              );
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Ten dich vu</th>
                      <th className="px-4 py-3 text-right">Xe so</th>
                      <th className="px-4 py-3 text-right">Xe ga</th>
                      <th className="px-4 py-3 text-right">PKL</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={tempSelectedServices.includes(service.id)}
                            onChange={(e) =>
                              handleServiceCheckChange(
                                service.id,
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {service.serviceName}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {service.priceManual?.toLocaleString("vi-VN")}d
                        </td>
                        <td className="px-4 py-3 text-right">
                          {service.priceScooter?.toLocaleString("vi-VN")}d
                        </td>
                        <td className="px-4 py-3 text-right">
                          {service.priceMoto?.toLocaleString("vi-VN")}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 h-16 border-t bg-white flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
               Đã chọn {tempSelectedServices.length} dịch vụ
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpenServiceModal(false)}
                  className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-sm"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleAddServices}
                  className="px-6 py-2 bg-[#B21B00] text-white rounded-xl hover:bg-[#8e1400] text-sm"
                >
                  Thêm vào combo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Components */

function FormField({
  as,
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
  const sharedClassName = `w-full rounded-lg border px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 ${
    error ? "border-red-500" : "border-stone-300"
  }`;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-stone-700">{label}</label>

      {as === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={sharedClassName}
          {...rest}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={sharedClassName}
          {...rest}
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
