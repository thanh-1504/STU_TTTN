import { useQuery } from "@tanstack/react-query";
import { Loader, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getReceptionistVehicles } from "../../api/receptionistService";

export default function ReceptionistVehicles() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["receptionist-vehicles", search],
    queryFn: () => getReceptionistVehicles(search),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Hồ sơ xe</h1>
          <p className="text-gray-500 text-sm">
            Tra cứu lịch sử bảo dưỡng xe
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-white p-4 border rounded mb-6 flex gap-2"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo biển số hoặc hãng xe..."
          className="border p-2 rounded flex-1"
        />
        <button
          type="submit"
          className="bg-zinc-800 text-white px-4 py-2 rounded flex items-center gap-1"
        >
          <Search size={16} /> Tìm
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
            }}
            className="border px-3 py-2 rounded hover:bg-gray-50"
          >
            Xóa lọc
          </button>
        )}
      </form>

      <div className="bg-white border rounded overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            <p>Đang tải...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Không có xe</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Biển số</th>
                <th className="p-3 text-left">Hãng / Model</th>
                <th className="p-3 text-left">Loại</th>
                <th className="p-3 text-left">Chủ xe</th>
                <th className="p-3 text-right">KM</th>
                <th className="p-3 text-center">Số phiếu</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold">{v.licensePlate}</td>
                  <td className="p-3">
                    {v.brand} {v.model || ""}
                  </td>
                  <td className="p-3 text-xs">{v.vehicleType}</td>
                  <td className="p-3">
                    <p className="text-sm">{v.customer?.customerName}</p>
                    <p className="text-xs text-gray-500">{v.customer?.phone}</p>
                  </td>
                  <td className="p-3 text-right">
                    {v.currentKm?.toLocaleString("vi-VN") || "—"}
                  </td>
                  <td className="p-3 text-center">
                    {v._count?.repairOrders ?? 0}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/receptionist/vehicles/${v.id}`}
                      className="text-blue-700 text-xs"
                    >
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
