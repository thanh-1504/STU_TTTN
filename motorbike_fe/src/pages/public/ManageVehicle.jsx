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
  uploadVehicleImage,
} from "../../api/portalService";

export default function ManageVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [currentKm, setCurrentKm] = useState(0);
  const [vehicleType, setVehicleType] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["myVehicles"],
    queryFn: getMyVehicles,
  });

  useEffect(() => {
    if (!isEditMode || vehicles.length === 0) return;

    const vehicle = vehicles.find((item) => item.id === Number.parseInt(id, 10));
    if (!vehicle) return;

    setBrand(vehicle.brand);
    setModel(vehicle.model || "");
    setLicensePlate(vehicle.licensePlate);
    setCurrentKm(Number(vehicle.currentKm) || 0);
    setVehicleType(vehicle.vehicleType);
    setNotes(vehicle.notes || "");
    setImageFile(null);
    setOriginalImageUrl(vehicle.imageUrl || null);
    setImagePreview(vehicle.imageUrl || null);
  }, [id, isEditMode, vehicles]);

  const addMutation = useMutation({
    mutationFn: addVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      toast.success("Them xe thanh cong!", {
        duration: 3000,
        style: { fontFamily: "inherit" },
      });
      navigate("/history");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Them xe that bai. Vui long thu lai.",
        { duration: 4000, style: { fontFamily: "inherit" } },
      );
    },
  });

  const updateKmMutation = useMutation({
    mutationFn: (payload) => updateVehicleKm(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      toast.success("Cap nhat so KM thanh cong!", {
        duration: 3000,
        style: { fontFamily: "inherit" },
      });
      navigate("/history");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Cap nhat that bai. Vui long thu lai.",
        { duration: 4000, style: { fontFamily: "inherit" } },
      );
    },
  });

  const handleImageChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui long chon file anh hop le (PNG, JPG, WEBP...).", {
        duration: 3500,
        style: { fontFamily: "inherit" },
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Anh qua lon. Vui long chon anh duoi 5MB.", {
        duration: 3500,
        style: { fontFamily: "inherit" },
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result || null);
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleImageChange(event.dataTransfer.files?.[0]);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const km = Number(currentKm) || 0;

    try {
      setIsUploadingImage(true);

      let uploadedImageUrl;
      if (imageFile) {
        const uploadResult = await uploadVehicleImage(imageFile);
        uploadedImageUrl = uploadResult.imageUrl;
      }

      if (isEditMode) {
        const payload = { currentKm: km };

        if (uploadedImageUrl) {
          payload.imageUrl = uploadedImageUrl;
        } else if (originalImageUrl && !imagePreview) {
          payload.imageUrl = null;
        }

        updateKmMutation.mutate(payload);
        return;
      }

      addMutation.mutate({
        brand,
        model,
        licensePlate,
        currentKm: km,
        vehicleType,
        ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
        ...(notes ? { notes } : {}),
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Upload anh that bai. Vui long thu lai.",
        { duration: 4000, style: { fontFamily: "inherit" } },
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-zinc-900 pb-20 md:pb-0">
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-black text-red-600 uppercase">
          Shop2banh
        </NavLink>
      </header>

      <div className="flex min-h-screen">
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className="mb-8">
              <button
                onClick={() => navigate("/history")}
                className="flex cursor-pointer items-center gap-1 text-zinc-500 hover:text-red-700 mb-4"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Quay lai Gara</span>
              </button>

              <h2 className="text-2xl font-bold">
                {isEditMode ? "Cap nhat so KM" : "Them xe moi vao Gara"}
              </h2>
              <p className="text-zinc-500 mt-1">
                {isEditMode
                  ? "Cap nhat so kilomet de theo doi lich trinh bao duong chinh xac hon."
                  : "Dang ky xe cua ban de theo doi lich trinh bao duong dinh ky tot hon."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">
                    Anh dai dien xe
                  </p>

                  <div
                    onClick={() =>
                      !imagePreview &&
                      document.getElementById("vehicleImageInput")?.click()
                    }
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden ${
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
                          alt="Anh xe"
                          className="w-full h-full object-cover"
                          style={{ maxHeight: "240px" }}
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveImage();
                          }}
                          className="absolute top-2 right-2 bg-white border border-zinc-200 rounded-full p-1 shadow hover:bg-red-50 hover:border-red-300 transition"
                          title="Xoa anh"
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
                          Nhan de tai len hoac keo tha anh xe cua ban
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    id="vehicleImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      handleImageChange(event.target.files?.[0] || null)
                    }
                  />

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("vehicleImageInput")?.click()
                      }
                      className="mt-3 w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm text-zinc-600 font-medium transition"
                    >
                      Doi anh khac
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup label="Hang xe *">
                      <div className="relative">
                        <select
                          disabled={isEditMode}
                          required
                          value={brand}
                          onChange={(event) => setBrand(event.target.value)}
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <option value="">Chon hang xe</option>
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

                    <FormGroup label="Dong xe">
                      <input
                        disabled={isEditMode}
                        type="text"
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                        placeholder="VD: Winner X, SH 150i..."
                        className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      />
                    </FormGroup>

                    <FormGroup label="Loai xe *">
                      <div className="relative">
                        <select
                          disabled={isEditMode}
                          required
                          value={vehicleType}
                          onChange={(event) => setVehicleType(event.target.value)}
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <option value="">Chon loai xe</option>
                          <option value="MANUAL">Xe so</option>
                          <option value="SCOOTER">Xe tay ga</option>
                          <option value="BIG">Phan khoi lon</option>
                        </select>
                        <ChevronDown
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                      </div>
                    </FormGroup>

                    <FormGroup label="Bien so xe *">
                      <input
                        disabled={isEditMode}
                        required
                        type="text"
                        value={licensePlate}
                        onChange={(event) => setLicensePlate(event.target.value)}
                        placeholder="VD: 59-G1 123.45"
                        className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      />
                    </FormGroup>

                    <FormGroup label="So KM hien tai *">
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min={0}
                          value={currentKm}
                          onChange={(event) =>
                            setCurrentKm(Number(event.target.value))
                          }
                          placeholder="0"
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                          km
                        </span>
                      </div>
                    </FormGroup>
                  </div>

                  <FormGroup label="Ghi chu (Tuy chon)">
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Nhap cac luu y ve tinh trang xe hoac phu tung ban quan tam..."
                      rows={4}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
                    />
                  </FormGroup>

                  <div className="pt-6 border-t border-zinc-100 flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={
                        isUploadingImage ||
                        addMutation.isPending ||
                        updateKmMutation.isPending
                      }
                      className="h-14 px-8 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Save size={18} />
                      {isUploadingImage
                        ? "Dang tai anh..."
                        : isEditMode
                          ? "Cap nhat KM"
                          : "Luu thong tin xe"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/history")}
                      className="h-14 px-8 border border-zinc-300 rounded-xl hover:bg-zinc-50 text-zinc-700 font-medium"
                    >
                      Huy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <div>
                  <div className="text-xl font-black text-white uppercase mb-3">
                    Shop2banh
                  </div>
                  <p className="text-sm leading-relaxed mb-4">
                    He thong dich vu xe may chuyen nghiep, uy tin tai TP.HCM.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-bold text-sm mb-4 uppercase">
                    Dich vu
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Bao duong dinh ky",
                      "Thay nhot",
                      "Rua xe",
                      "Sua chua dien",
                      "Thay lop",
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
                    Ho tro
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Huong dan dat lich",
                      "Chinh sach bao hanh",
                      "Cau hoi thuong gap",
                      "Lien he",
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
                    Lien he
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>309 Vuon Lai, P. Phu Tho Hoa, Q. Tan Phu, TP.HCM</li>
                    <li>
                      SDT:{" "}
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 flex items-center justify-around z-50">
        <MobileItem icon={<Home size={18} />} label="Trang chu" />
        <MobileItem icon={<CalendarDays size={18} />} label="Lich hen" />
        <MobileItem active icon={<Warehouse size={18} />} label="Gara" />
        <MobileItem icon={<User size={18} />} label="Toi" />
      </nav>
    </div>
  );
}

function MobileItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center text-[10px] ${
        active ? "text-red-700 font-bold" : "text-zinc-400"
      }`}
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
