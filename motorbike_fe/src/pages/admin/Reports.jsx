export default function AdminReports() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Báo cáo & Thống kê</h1>
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Doanh thu theo ngày</h2>
          <p className="text-gray-400 text-sm">Biểu đồ doanh thu sẽ hiển thị ở đây. Tích hợp API: GET /reports/revenue</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Dịch vụ phổ biến</h2>
          <p className="text-gray-400 text-sm">Thống kê dịch vụ sẽ hiển thị ở đây. Tích hợp API: GET /reports/top-services</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Khách hàng thân thiết</h2>
        <p className="text-gray-400 text-sm">Tích hợp API: GET /reports/top-customers</p>
      </div>
    </div>
  );
}
