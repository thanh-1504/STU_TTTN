export default function AdminInventory() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kho Phụ Tùng</h1>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
          + Nhập kho
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-orange-600 font-bold text-lg">0</p>
          <p className="text-sm text-gray-500 mt-1">Phụ tùng sắp hết</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-400 text-sm">Danh sách phụ tùng sẽ hiển thị ở đây. Tích hợp API: GET /spare-parts</p>
      </div>
    </div>
  );
}
