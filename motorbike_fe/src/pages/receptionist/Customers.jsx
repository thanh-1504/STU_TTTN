import { useQuery } from "@tanstack/react-query";
import { Loader, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getReceptionistCustomers } from "../../api/receptionistService";

export default function ReceptionistCustomers() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["receptionist-customers", search],
    queryFn: () => getReceptionistCustomers(search),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Khách hàng</h1>
          <p className="text-gray-500 text-sm">Tra cứu thông tin khách hàng</p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-white p-4 border rounded mb-6 flex gap-2"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo SĐT hoặc tên khách hàng..."
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
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Không có khách hàng phù hợp
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Tên</th>
                <th className="p-3 text-left">SĐT</th>
                <th className="p-3 text-left">Địa chỉ</th>
                <th className="p-3 text-center">Xe</th>
                <th className="p-3 text-center">Phiếu sửa</th>
                <th className="p-3 text-right">Tổng chi tiêu</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold">#{c.id}</td>
                  <td className="p-3 font-medium">{c.customerName || "—"}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {c.address || "—"}
                  </td>
                  <td className="p-3 text-center">
                    {c._count?.vehicles ?? 0}
                  </td>
                  <td className="p-3 text-center">
                    {c._count?.repairOrders ?? 0}
                  </td>
                  <td className="p-3 text-right font-semibold text-red-700">
                    {Number(c.totalSpent ?? 0).toLocaleString("vi-VN")}đ
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/receptionist/customers/${c.id}`}
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
