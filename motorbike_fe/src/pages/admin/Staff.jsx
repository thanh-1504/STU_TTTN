import { Loader, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { deleteStaff, getStaffList } from "../../api/usersService";
import Pagination from "../../components/Pagination";
import { useNavigate } from "react-router-dom";

export default function AdminStaff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState({
    role: "",
    isActive: null,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStaff();
  }, [page, filter]);

  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getStaffList(
        page,
        pageSize,
        filter.role || null,
        filter.isActive,
      );

      let filteredStaff = response.users;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredStaff = filteredStaff.filter(
          (member) =>
            member.fullname?.toLowerCase().includes(query) ||
            member.username?.toLowerCase().includes(query) ||
            member.phone?.includes(query),
        );
      }

      setStaff(filteredStaff);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Lỗi tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilter((prev) => ({
      ...prev,
      [filterName]: value === "" ? null : value,
    }));
    setPage(1);
  };

  const handleDeleteStaff = async (member) => {
    const result = await Swal.fire({
      title: "Xóa người dùng?",
      text: `Bạn có muốn xóa người dùng "${member.fullname}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteStaff(member.id);
      fetchStaff();
    } catch (err) {
      setError("Lỗi cập nhật trạng thái nhân viên");
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const displayCount = staff.length > 0 ? `${startIndex} - ${endIndex}` : "0";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Nhân sự</h2>
        </div>

        <NavLink
          to="/admin/staff/create"
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          Thêm nhân viên mới
        </NavLink>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <select
          value={filter.role}
          onChange={(e) => handleFilterChange("role", e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Tất cả vai trò</option>
          <option value="RECEPTIONIST">Lễ Tân</option>
          <option value="TECHNICIAN">Kỹ Thuật Viên</option>
        </select>

        <select
          value={
            filter.isActive === null
              ? ""
              : filter.isActive
                ? "active"
                : "inactive"
          }
          onChange={(e) => {
            if (e.target.value === "") {
              handleFilterChange("isActive", "");
            } else {
              handleFilterChange("isActive", e.target.value === "active");
            }
          }}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang làm việc</option>
          <option value="inactive">Vô hiệu hóa</option>
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-sm text-stone-500">
              <Loader className="animate-spin" size={18} />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              Không tìm thấy nhân viên nào
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Chức vụ</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t hover:bg-stone-50 transition"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold">{member.fullname}</p>
                        <p className="text-xs text-stone-500">
                          @{member.username}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {member.role?.roleName === "RECEPTIONIST"
                          ? "Lễ Tân"
                          : member.role?.roleName === "TECHNICIAN"
                            ? "Kỹ Thuật Viên"
                            : member.role?.roleName}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p>{member.phone || "Chưa cập nhật"}</p>
                      <p className="text-xs text-stone-500">
                        {member.email || "Chưa cập nhật"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.isActive ? "Đang làm việc" : "Vô hiệu hóa"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/staff/edit/${member.id}`)
                          }
                          className="p-2 hover:cursor-pointer hover:bg-zinc-100 rounded-lg"
                          title="Chỉnh sửa nhân viên"
                        >
                          <Pencil className="w-4 h-4 text-zinc-500" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member)}
                          className="inline-flex hover:cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Ngưng hoạt động"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t px-4 py-3 flex justify-between items-center text-sm">
          <p className="text-stone-500">
            Hiển thị {displayCount} trong {total} mục
          </p>

          <Pagination
            pageCount={totalPages}
            currentPage={page - 1}
            onPageChange={({ selected }) => setPage(selected + 1)}
          />
        </div>
      </div>
    </div>
  );
}
