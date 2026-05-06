import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  Headset,
  Home,
  Info,
  LayoutDashboard,
  Save,
  User,
  UserCircle2,
  Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addVehicle, getMyVehicles, updateVehicleKm } from "../../api/portalService";

export default function ManageVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [vehicleType, setVehicleType] = useState("");

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
        setCurrentKm(vehicle.currentKm);
        setVehicleType(vehicle.vehicleType);
      }
    }
  }, [id, isEditMode, vehicles]);

  const addMutation = useMutation({
    mutationFn: addVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries(["myVehicles"]);
      alert("Thêm xe thành công!");
      navigate("/portal");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Lỗi khi thêm xe");
    },
  });

  const updateKmMutation = useMutation({
    mutationFn: (data) => updateVehicleKm(id, data.currentKm),
    onSuccess: () => {
      queryClient.invalidateQueries(["myVehicles"]);
      alert("Cập nhật số KM thành công!");
      navigate("/portal");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Lỗi khi cập nhật");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      updateKmMutation.mutate({ currentKm: parseInt(currentKm) || 0 });
    } else {
      addMutation.mutate({
        brand,
        model,
        licensePlate,
        currentKm: parseInt(currentKm) || 0,
        vehicleType,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-zinc-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight uppercase text-red-700">
          Dịch vụ Xe máy
        </h1>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-zinc-100">
            <Bell size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-zinc-100">
            <UserCircle2 size={22} />
          </button>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex fixed top-16 left-0 w-64 h-[calc(100vh-64px)] bg-zinc-900 text-white flex-col">
          <nav className="flex-1 py-8">
            <ul className="space-y-1">
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Trang chủ" />
              <SidebarItem icon={<CalendarDays size={18} />} label="Lịch hẹn" />

              <li className="border-l-4 border-red-600 bg-zinc-800">
                <a className="flex items-center gap-3 px-6 py-3 text-white font-semibold cursor-pointer" onClick={() => navigate("/portal")}>
                  <Warehouse size={18} className="text-red-500" />
                  Garage của tôi
                </a>
              </li>

              <SidebarItem icon={<Headset size={18} />} label="Hỗ trợ" />
            </ul>
          </nav>

          <div className="p-6 border-t border-zinc-800 text-xs uppercase tracking-widest text-zinc-500">
            Hệ thống v2.1
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            {/* Title */}
            <div className="mb-8">
              <button onClick={() => navigate("/portal")} className="flex items-center gap-1 text-zinc-500 hover:text-red-700 mb-4">
                <ArrowLeft size={16} />
                <span className="text-sm">Quay lại Gara</span>
              </button>

              <h2 className="text-2xl font-bold">
                {isEditMode ? "Cập nhật số KM" : "Thêm xe mới vào Gara"}
              </h2>
              <p className="text-zinc-500 mt-1">
                {isEditMode ? "Cập nhật số kilomet để theo dõi lịch trình bảo dưỡng chính xác hơn." : "Đăng ký xe của bạn để theo dõi lịch trình bảo dưỡng định kỳ tốt hơn."}
              </p>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left */}
              <div className="lg:col-span-5 space-y-6">
                {/* Tip */}
                <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-5">
                  <div className="flex gap-3">
                    <Info size={20} className="text-red-700 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Mẹo nhỏ</h4>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        Cập nhật số km thường xuyên giúp hệ thống tính toán và nhắc nhở bạn thời gian bảo dưỡng, thay dầu nhớt kịp thời để đảm bảo tuổi thọ của xe.
                      </p>
                    </div>
                  </div>
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
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
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
                          <option value="MANUAL">Xe số (Manual)</option>
                          <option value="SCOOTER">Xe tay ga (Scooter)</option>
                          <option value="BIG">Phân khối lớn (Big)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
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
                          min="0"
                          value={currentKm}
                          onChange={(e) => setCurrentKm(e.target.value)}
                          placeholder="0"
                          className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">km</span>
                      </div>
                    </FormGroup>
                  </div>

                  {/* Buttons */}
                  <div className="pt-6 border-t border-zinc-100 flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={addMutation.isPending || updateKmMutation.isPending}
                      className="h-14 px-8 bg-red-700 hover:bg-red-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Save size={18} />
                      {isEditMode ? "Cập nhật KM" : "Lưu thông tin xe"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/portal")}
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
          <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h3 className="font-bold text-lg">Shop2banh Garage</h3>
                <p className="text-sm text-zinc-500 mt-1">© 2024 Hệ thống Quản lý Garage. Bảo lưu mọi quyền.</p>
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

/* Components */
function SidebarItem({ icon, label }) {
  return (
    <li>
      <a className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer">
        {icon}
        {label}
      </a>
    </li>
  );
}

function MobileItem({ icon, label, active }) {
  return (
    <button className={`flex flex-col items-center text-[10px] ${active ? "text-red-700 font-bold" : "text-zinc-400"}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-600">{label}</label>
      {children}
    </div>
  );
}
