export default function AdminReviews() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Đánh giá</h1>
      <div className="flex gap-3 mb-6">
        <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
          Chờ duyệt (0)
        </button>
        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
          Đã duyệt (0)
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
          Đã ẩn (0)
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-400 text-sm">Danh sách đánh giá sẽ hiển thị ở đây. Tích hợp API: GET /reviews</p>
      </div>
    </div>
  );
}
