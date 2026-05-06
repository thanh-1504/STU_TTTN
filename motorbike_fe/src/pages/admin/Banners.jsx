export default function AdminBanners() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          + Thêm banner
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-400 text-sm">Danh sách banner sẽ hiển thị ở đây. Tích hợp API: GET /banners</p>
      </div>
    </div>
  );
}
