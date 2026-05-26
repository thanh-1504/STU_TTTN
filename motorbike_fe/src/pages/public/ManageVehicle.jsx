import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Home,
  ImagePlus,
  Save,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  addVehicle,
  getMyVehicles,
  updateVehicleKm,
} from "../../api/portalService";
import { getVehicleImage, saveVehicleImage } from "../../utils/vehicleImage";

export default function ManageVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [currentKm, setCurrentKm] = useState(0);
  const [vehicleType, setVehicleType] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["myVehicles"],
    queryFn: getMyVehicles,
  });

  useEffect(() => {
    if (isEditMode && vehicles.length > 0) {
      const vehicle = vehicles.find((v) => v.id === parseInt(id));
      if (vehicle) {
        setBrand(vehicle.brand);
        setModel(vehicle.model || "");
        setLicensePlate(vehicle.licensePlate);
        setCurrentKm(Number(vehicle.currentKm));
        setVehicleType(vehicle.vehicleType);
        // Restore previously saved image for this vehicle
        const saved = getVehicleImage(vehicle.id);
        if (saved) setImagePreview(saved);
      }
    }
  }, [id, isEditMode, vehicles]);

  const addMutation = useMutation({
    mutationFn: addVehicle,
    onSuccess: (newVehicle) => {
      // Persist the selected image so CustomerPortal can display it
      if (imagePreview && newVehicle?.id) {
        saveVehicleImage(newVehicle.id, imagePreview);
      }
      queryClient.invalidateQueries(["myVehicles"]);
      toast.success("Thêm xe thành công!", {
        duration: 3000,
        style: { fontFamily: "inherit" },
      });
      navigate("/history");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Thêm xe thất bại. Vui lòng thử lại.",
        { duration: 4000, style: { fontFamily: "inherit" } },
      );
    },
  });

  const updateKmMutation = useMutation({
    mutationFn: (data) => updateVehicleKm(id, data.currentKm),
    onSuccess: () => {
      // Also persist a newly selected image when updating
      if (imagePreview) {
        saveVehicleImage(parseInt(id), imagePreview);
      }
      queryClient.invalidateQueries(["myVehicles"]);
      toast.success("Cập nhật số KM thành công!", {
        duration: 3000,
        style: { fontFamily: "inherit" },
      });
      navigate("/history");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.",
        { duration: 4000, style: { fontFamily: "inherit" } },
      );
    },
  });

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ (PNG, JPG, WEBP...).", {
        duration: 3500,
        style: { fontFamily: "inherit" },
      });
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 30MB.", {
        duration: 3500,
        style: { fontFamily: "inherit" },
      });
      return;
    }
    setImageFile(file);
    // Use FileReader so the preview is a base64 data URL (survives navigation)
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleImageChange(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const km = Number(currentKm) || 0;
    if (isEditMode) {
      updateKmMutation.mutate({ currentKm: km });
    } else {
      addMutation.mutate({
        brand,
        model,
        licensePlate,
        currentKm: km,
        vehicleType,
        ...(notes ? { notes } : {}),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-zinc-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-black text-red-600 uppercase">
          Shop2banh
        </NavLink>
      </header>

      <div className="flex min-h-screen">
        {/* Main */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            {/* Title */}
            <div className="mb-8">
              <button
                onClick={() => navigate("/history")}
                className="flex cursor-pointer items-center gap-1 text-zinc-500 hover:text-red-700 mb-4"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Quay lại Gara</span>
              </button>

              <h2 className="text-2xl font-bold">
                {isEditMode ? "Cập nhật số KM" : "Thêm xe mới vào Gara"}
              </h2>
              <p className="text-zinc-500 mt-1">
                {isEditMode
                  ? "Cập nhật số kilomet để theo dõi lịch trình bảo dưỡng chính xác hơn."
                  : "Đăng ký xe của bạn để theo dõi lịch trình bảo dưỡng định kỳ tốt hơn."}
              </p>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left */}
              <div className="lg:col-span-5 space-y-6">
                {/* Image Upload */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">
                    Ảnh đại diện xe
                  </p>

                  <div
                    onClick={() =>
                      !imagePreview &&
                      document.getElementById("vehicleImageInput").click()
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden
                      ${
                        isDragging
                          ? "border-red-400 bg-red-50"
                          : imagePreview
                            ? "border-zinc-200 bg-zinc-50"
                            : "border-zinc-300 bg-zinc-50 hover:border-red-400 hover:bg-red-50 cursor-pointer"
                      }`}
                    style={{ minHeight: "200px" }}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Ảnh xe"
                          className="w-full h-full object-cover"
                          style={{ maxHeight: "240px" }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage();
                          }}
                          className="absolute top-2 right-2 bg-white border border-zinc-200 rounded-full p-1 shadow hover:bg-red-50 hover:border-red-300 transition"
                          title="Xóa ảnh"
                        >
                          <X size={14} className="text-zinc-600" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                          <ImagePlus size={22} className="text-zinc-400" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">
                          Nhấp để tải lên hoặc kéo thả ảnh xe của bạn
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    id="vehicleImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                  />

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("vehicleImageInput").click()
                      }
                      className="mt-3 w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm text-zinc-600 font-medium transition"
                    >
                      Đổi ảnh khác
                    </button>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand */}
                    <FormGroup label="Hãng xe *">
                      <div className="relative">
                        <select
                          disabled={isEditMode}
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <option value="">Chọn hãng xe</option>
                          <option value="Honda">Honda</option>
                          <option value="Yamaha">Yamaha</option>
                          <option value="Vespa">Vespa</option>
                          <option value="Suzuki">Suzuki</option>
                          <option value="Piaggio">Piaggio</option>
                        </select>
                        <ChevronDown
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                      </div>
                    </FormGroup>

                    {/* Dòng xe */}
                    <FormGroup label="Dòng xe">
                      <input
                        disabled={isEditMode}
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="VD: Winner X, SH 150i..."
                        className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      />
                    </FormGroup>

                    {/* Loại xe */}
                    <FormGroup label="Loại xe *">
                      <div className="relative">
                        <select
                          disabled={isEditMode}
                          required
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <option value="">Chọn loại xe</option>
                          <option value="MANUAL">Xe số </option>
                          <option value="SCOOTER">Xe tay ga </option>
                          <option value="BIG">Phân khối lớn </option>
                        </select>
                        <ChevronDown
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                      </div>
                    </FormGroup>

                    {/* Plate */}
                    <FormGroup label="Biển số xe *">
                      <input
                        disabled={isEditMode}
                        required
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="VD: 59-G1 123.45"
                        className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      />
                    </FormGroup>

                    {/* KM */}
                    <FormGroup label="Số KM hiện tại *">
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min={0}
                          value={currentKm}
                          onChange={(e) => setCurrentKm(Number(e.target.value))}
                          placeholder="0"
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                          km
                        </span>
                      </div>
                    </FormGroup>
                  </div>

                  {/* Notes */}
                  <FormGroup label="Ghi chú (Tùy chọn)">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Nhập các lưu ý về tình trạng xe hoặc phụ tùng bạn quan tâm..."
                      rows={4}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
                    />
                  </FormGroup>

                  {/* Buttons */}
                  <div className="pt-6 border-t border-zinc-100 flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={
                        addMutation.isPending || updateKmMutation.isPending
                      }
                      className="h-14 px-8 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Save size={18} />
                      {isEditMode ? "Cập nhật KM" : "Lưu thông tin xe"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/history")}
                      className="h-14 px-8 border border-zinc-300 rounded-xl hover:bg-zinc-50 text-zinc-700 font-medium"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <div>
                  <div className="text-xl font-black text-white uppercase mb-3">
                    Shop2banh
                  </div>
                  <p className="text-sm leading-relaxed mb-4">
                    Hệ thống dịch vụ xe máy chuyên nghiệp, uy tín tại TP.HCM.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-bold text-sm mb-4 uppercase">
                    Dịch vụ
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Bảo dưỡng định kỳ",
                      "Thay nhớt",
                      "Rửa xe",
                      "Sửa chữa điện",
                      "Thay lốp",
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="/services"
                          className="hover:text-red-400 transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold text-sm mb-4 uppercase">
                    Hỗ trợ
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Hướng dẫn đặt lịch",
                      "Chính sách bảo hành",
                      "Câu hỏi thường gặp",
                      "Liên hệ",
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="hover:text-red-400 transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold text-sm mb-4 uppercase">
                    Liên hệ
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>309 Vườn Lài, P. Phú Thọ Hòa, Q. Tân Phú, TP.HCM</li>
                    <li>
                      SĐT:{" "}
                      <a href="tel:0938820202" className="hover:text-red-400">
                        0938.82.02.02
                      </a>
                    </li>
                    <li>
                      Email:{" "}
                      <a
                        href="mailto:info@shop2banh.vn"
                        className="hover:text-red-400"
                      >
                        shop2banh@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 flex items-center justify-around z-50">
        <MobileItem icon={<Home size={18} />} label="Trang chủ" />
        <MobileItem icon={<CalendarDays size={18} />} label="Lịch hẹn" />
        <MobileItem active icon={<Warehouse size={18} />} label="Gara" />
        <MobileItem icon={<User size={18} />} label="Tôi" />
      </nav>
    </div>
  );
}

function MobileItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center text-[10px] ${active ? "text-red-700 font-bold" : "text-zinc-400"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-600">
        {label}
      </label>
      {children}
    </div>
  );
}
