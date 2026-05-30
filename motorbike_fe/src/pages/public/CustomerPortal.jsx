import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Edit,
  History,
  ImagePlus,
  PlusCircle,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { deleteVehicle, getMyVehicles } from "../../api/portalService";

function VehicleCard({ item, onDelete }) {
  const navigate = useNavigate();
  const imageUrl = item.imageUrl;

  const confirmDelete = async () => {
    const result = await Swal.fire({
      title: "Xoa xe nay?",
      html: `Xe <strong>${item.brand} ${item.model || ""}</strong> (${item.licensePlate}) se bi xoa vinh vien.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xoa xe",
      cancelButtonText: "Huy",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        title: "swal2-title-custom",
        popup: "swal2-popup-custom",
      },
    });

    if (result.isConfirmed) {
      onDelete(item.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-red-600 transition flex flex-col">
      <div className="relative h-52 bg-gray-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${item.brand} ${item.model || ""}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <Bike size={64} className="text-gray-300" />
        )}

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow text-sm font-semibold flex items-center gap-1">
          <Bike size={16} className="text-red-600" />
          {item.currentKm?.toLocaleString() || 0} km
        </div>

        {!imageUrl && (
          <button
            onClick={() => navigate(`/portal/edit/${item.id}`)}
            title="Them anh xe"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 bg-white/80 rounded-full px-3 py-1 shadow transition"
          >
            <ImagePlus size={14} />
            Them anh
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {item.brand} {item.model || ""}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{item.licensePlate}</p>
            <p className="text-xs text-gray-400 mt-1">
              Loai: {item.vehicleType}
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
              Cap nhat so KM
            </button>

            <button
              onClick={confirmDelete}
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
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      Swal.fire({
        title: "Xoa thanh cong!",
        text: "Xe da duoc xoa khoi Gara cua ban.",
        icon: "success",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "OK",
        timer: 2500,
        timerProgressBar: true,
      });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        "Xoa xe that bai. Xe co the dang co phieu sua chua chua hoan tat.";
      Swal.fire({
        title: "Xoa that bai!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Dong",
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-gray-900 flex flex-col">
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Gara của tôi</h1>
          </div>

          <NavLink
            to="/portal/create"
            className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Them xe moi
          </NavLink>
        </div>

        {isLoading ? (
          <p>Dang tai danh sach xe...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((item) => (
              <VehicleCard
                key={item.id}
                item={item}
                onDelete={(vehicleId) => deleteMutation.mutate(vehicleId)}
              />
            ))}

            {vehicles.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Bike size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">
                  Chua co xe nao
                </h3>
                <p className="text-gray-500 mt-1">
                  Hay them xe cua ban vao Gara de theo doi bao duong tot hon.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t grid grid-cols-4 text-xs z-50">
        <a className="flex flex-col items-center justify-center text-gray-500">
          <Bike size={18} />
          Gara
        </a>

        <a className="flex flex-col items-center justify-center text-gray-500">
          <History size={18} />
          Lich su
        </a>

        <a className="flex flex-col items-center justify-center text-gray-500">
          <Wrench size={18} />
          Bao tri
        </a>

        <a className="flex flex-col items-center justify-center text-red-600 font-semibold">
          <User size={18} />
          Ca nhan
        </a>
      </nav>
    </div>
  );
}
