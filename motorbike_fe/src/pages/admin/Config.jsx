export default function AdminConfig() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cấu hình Hệ thống</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-400 text-sm mb-4">
          Quản lý các thông số hệ thống (giờ làm việc, thông tin liên hệ, v.v.)
        </p>
        <p className="text-gray-400 text-sm">Tích hợp API: GET /system-config &amp; POST /system-config</p>
      </div>
    </div>
  );
}
