import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createService,
  getServiceById,
  updateService,
  uploadServiceImage,
} from "../../api/servicesService";
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

export default function AddService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { notify, notifications } = useNotification();

  const [form, setForm] = useState({
    serviceName: "",
    description: "",
    durationMinutes: "",
    priceManual: "",
    priceScooter: "",
    priceMoto: "",
    isActive: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      const fetchServiceData = async () => {
        try {
          const data = await getServiceById(id);
          setForm({
            serviceName: data.serviceName || "",
            description: data.description || "",
            durationMinutes: data.durationMinutes || "",
            priceManual: data.priceManual || "",
            priceScooter: data.priceScooter || "",
            priceMoto: data.priceMoto || "",
            isActive: data.isActive || true,
          });
          if (data.imageUrl) {
            setImagePreview(data.imageUrl);
          }
        } catch (error) {
          console.error("Error fetching service:", error);
          notify.error("Không thể tải thông tin dịch vụ");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchServiceData();
    }
  }, [id, isEditMode, navigate]);

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

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      notify.error("Ảnh vượt quá giới hạn 5MB");
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

  const validateForm = () => {
    const errors = {};

    if (!form.serviceName.trim()) {
      errors.serviceName = "Tên dịch vụ không được để trống";
    }

    if (!form.durationMinutes || Number(form.durationMinutes) <= 0) {
      errors.durationMinutes = "Thời gian thực hiện phải lớn hơn 0";
    }

    if (!form.priceManual || Number(form.priceManual) <= 0) {
      errors.priceManual = "Giá xe số phải lớn hơn 0";
    }

    if (!form.priceScooter || Number(form.priceScooter) <= 0) {
      errors.priceScooter = "Giá xe ga phải lớn hơn 0";
    }

    if (!form.priceMoto || Number(form.priceMoto) <= 0) {
      errors.priceMoto = "Giá xe PKL phải lớn hơn 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      notify.error("Vui lòng kiểm tra lại dữ liệu bắt buộc");
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      let imageUrl;

      if (selectedImage) {
        setUploading(true);
        const uploadResult = await uploadServiceImage(selectedImage);
        imageUrl = uploadResult.imageUrl;
        setUploading(false);
      }

      const payload = {
        serviceName: form.serviceName.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        priceManual: Number(form.priceManual),
        priceScooter: Number(form.priceScooter),
        priceMoto: Number(form.priceMoto),
        isActive: form.isActive,
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      let result;
      if (isEditMode) {
        result = await updateService(id, payload);
      } else {
        result = await createService(payload);
      }

      if (!result.success) {
        setFieldErrors(result.errors || {});
        notify.error(
          result.errors?.general ||
            (isEditMode ? "Cập nhật dịch vụ thất bại" : "Tạo dịch vụ thất bại"),
        );
        return;
      }

      notify.success(
        isEditMode ? "Cập nhật dịch vụ thành công" : "Tạo dịch vụ thành công",
      );

      setTimeout(() => {
        navigate("/admin/services");
      }, 1200);
    } catch (error) {
      console.error("Error:", error);
      notify.error("Có lỗi xảy ra trong quá trình xử lý dịch vụ");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-8 text-stone-900">
      <NotificationContainer
        notifications={notifications}
        removeNotification={() => {}}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderCircle size={32} className="animate-spin text-red-600" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
                </h1>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/services")}
                  disabled={loading}
                  className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="create-service-form"
                  disabled={loading || uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
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
                        ? "Cập nhật dịch vụ"
                        : "Lưu dịch vụ"}
                </button>
              </div>
            </div>

            <form
              id="create-service-form"
              onSubmit={handleSubmit}
              className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="space-y-6">
                <section className="rounded-xl border bg-white p-6">
                  <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>

                  <div className="mt-5 grid gap-5">
                    <FormField
                      label="Tên dịch vụ *"
                      name="serviceName"
                      value={form.serviceName}
                      onChange={handleChange}
                      error={fieldErrors.serviceName}
                      placeholder="Bao duong tong quat"
                    />

                    <FormField
                      label="Mô tả"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      error={fieldErrors.description}
                      placeholder="Mo ta ngan ve noi dung dich vu"
                      as="textarea"
                      rows={4}
                    />

                    <FormField
                      label="Thời gian thực hiện (phút) *"
                      name="durationMinutes"
                      value={form.durationMinutes}
                      onChange={handleChange}
                      error={fieldErrors.durationMinutes}
                      placeholder="60"
                      type="number"
                      min="1"
                    />
                  </div>
                </section>

                <section className="rounded-xl border bg-white p-6">
                  <h2 className="text-lg font-semibold">Bảng giá</h2>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <FormField
                      label="Giá xe số *"
                      name="priceManual"
                      value={form.priceManual}
                      onChange={handleChange}
                      error={fieldErrors.priceManual}
                      placeholder="150000"
                      type="number"
                      min="1"
                    />

                    <FormField
                      label="Giá xe ga *"
                      name="priceScooter"
                      value={form.priceScooter}
                      onChange={handleChange}
                      error={fieldErrors.priceScooter}
                      placeholder="180000"
                      type="number"
                      min="1"
                    />

                    <FormField
                      label="Giá xe PKL *"
                      name="priceMoto"
                      value={form.priceMoto}
                      onChange={handleChange}
                      error={fieldErrors.priceMoto}
                      placeholder="350000"
                      type="number"
                      min="1"
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-xl border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Trạng thái</h2>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-3">
                      <span className="text-sm font-medium">
                        {form.isActive ? "Bật kinh doanh" : "Tạm ẩn"}
                      </span>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 accent-red-600"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Ảnh đại diện</h2>
                      <p className="mt-1 text-sm text-stone-500">
                        Không bắt buộc. Hỗ trợ JPG, PNG, WEBP tối đa 5MB.
                      </p>
                    </div>

                    {selectedImage && (
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 hover:bg-stone-100"
                        title="Xoa anh"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <label className="mt-5 block cursor-pointer">
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
                            alt="Preview service"
                            className="aspect-video w-full object-cover"
                          />
                          <div className="border-t bg-white px-4 py-3 text-sm text-stone-600">
                            {selectedImage?.name}
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-3 px-4 text-center text-stone-500">
                          <div className="rounded-full bg-white p-3 shadow-sm">
                            <ImagePlus size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-700">
                              Chon anh dich vu
                            </p>
                            <p className="mt-1 text-xs">
                              Bam de tai len anh tu may tinh
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
          </>
        )}
      </div>
    </div>
  );
}

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
