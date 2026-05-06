import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Edit,
  History,
  PlusCircle,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { deleteVehicle, getMyVehicles } from "../../api/portalService";

function VehicleCard({ item, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-red-600 transition flex flex-col">
      <div className="relative h-52 bg-gray-100 flex items-center justify-center">
        <Bike size={64} className="text-gray-300" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow text-sm font-semibold flex items-center gap-1">
          <Bike size={16} className="text-red-600" />
          {item.currentKm?.toLocaleString() || 0} km
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {item.brand} {item.model || ""}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{item.licensePlate}</p>
            <p className="text-xs text-gray-400 mt-1">
              Loại: {item.vehicleType}
            </p>
          </div>
        </div>

        <div className="mt-auto border-t pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/portal/edit/${item.id}`)}
              className="flex-1 h-11 rounded-xl border bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Edit size={16} />
              Cập nhật số KM
            </button>

            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
                  onDelete(item.id);
                }
              }}
              className="w-11 h-11 rounded-xl border text-red-600 hover:bg-red-50 flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortal() {
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["myVehicles"],
    queryFn: getMyVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries(["myVehicles"]);
      alert("Xóa xe thành công!");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Xóa xe thất bại");
    },
  });

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-gray-900 flex flex-col">
      {/* Main */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Cá nhân (Gara của tôi)</h1>
            <p className="text-gray-500 mt-1">Quản lý danh sách xe của bạn</p>
          </div>

          <NavLink
            to={"/portal/create"}
            className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Thêm xe mới
          </NavLink>
        </div>

        {/* Grid */}
        {isLoading ? (
          <p>Đang tải danh sách xe...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((item) => (
              <VehicleCard
                key={item.id}
                item={item}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Bike size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">
                  Chưa có xe nào
                </h3>
                <p className="text-gray-500 mt-1">
                  Hãy thêm xe của bạn vào Gara để theo dõi bảo dưỡng tốt hơn.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer desktop */}
      <footer className="hidden md:flex border-t bg-gray-50 py-10 px-4 flex-col items-center gap-4">
        <div className="font-bold text-lg">Shop2banh</div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-red-600">
            Về chúng tôi
          </a>
          <a href="#" className="hover:text-red-600">
            Chính sách bảo mật
          </a>
          <a href="#" className="hover:text-red-600">
            Điều khoản dịch vụ
          </a>
          <a href="#" className="hover:text-red-600">
            Liên hệ
          </a>
        </div>

        <p className="text-sm text-gray-500 text-center">
          © 2024 Shop2banh.vn - Phụ tùng & Đồ chơi xe máy chuyên nghiệp
        </p>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t grid grid-cols-4 text-xs z-50">
        <a className="flex flex-col items-center justify-center text-gray-500">
          <Bike size={18} />
          Gara
        </a>

        <a className="flex flex-col items-center justify-center text-gray-500">
          <History size={18} />
          Lịch sử
        </a>

        <a className="flex flex-col items-center justify-center text-gray-500">
          <Wrench size={18} />
          Bảo trì
        </a>

        <a className="flex flex-col items-center justify-center text-red-600 font-semibold">
          <User size={18} />
          Cá nhân
        </a>
      </nav>
    </div>
  );
}
