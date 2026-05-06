import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMyAppointments, cancelMyAppointment } from "../../api/appointmentsService";
import { Calendar, Clock, Bike, User, MapPin, CheckCircle, X } from "lucide-react";

const BookingHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [showAlert, setShowAlert] = useState(location.state?.success || false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await getMyAppointments();
      const sorted = Array.isArray(res) 
        ? res.sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime)) 
        : [];
      setAppointments(sorted);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      if (error.response?.status === 401) {
        alert("Vui lòng đăng nhập để xem lịch sử.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) return;
    try {
      await cancelMyAppointment(id);
      alert("Hủy lịch thành công!");
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling:", error);
      alert("Có lỗi xảy ra khi hủy lịch: " + (error.response?.data?.message || error.message));
    }
  };

  const statusMap = {
    PENDING: {
      label: "Đang chờ",
      className: "bg-yellow-100 text-yellow-700",
      dotClass: "bg-yellow-500",
    },
    CONFIRMED: {
      label: "Đã xác nhận",
      className: "bg-blue-100 text-blue-700",
      dotClass: "bg-blue-500",
    },
    COMPLETED: {
      label: "Đã hoàn thành",
      className: "bg-green-100 text-green-700",
      dotClass: "bg-green-500",
    },
    CANCELLED: {
      label: "Đã hủy",
      className: "bg-gray-100 text-gray-600",
      dotClass: "bg-gray-400",
    },
  };

  const tabMap = {
    ALL: "Tất cả",
    PENDING: "Đang chờ",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
  };

  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.status === activeTab;
  });

  const getImages = (id) => {
    const images = [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80",
      "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=500&q=80",
      "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=500&q=80",
      "https://images.unsplash.com/photo-1487147264018-f937fba0c817?w=500&q=80"
    ];
    return images[id % images.length];
  };

  if (loading) {
    return <div className="max-w-[1200px] mx-auto px-6 py-10 text-center">Đang tải lịch sử...</div>;
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-10">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* Success Alert */}
        {showAlert && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-4 py-3 rounded-md mb-8 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
              <span className="text-sm">Đặt lịch thành công! Nhân viên tư vấn sẽ liên hệ với bạn trong giây lát.</span>
            </div>
            <button onClick={() => setShowAlert(false)} className="text-[#166534] hover:text-[#14532D]">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header & Filter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 mb-1">Lịch sử đặt lịch của tôi</h1>
            <p className="text-sm text-gray-500">
              Quản lý và theo dõi trạng thái bảo trì xe máy của bạn.
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(tabMap).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm rounded-md transition-colors ${
                  activeTab === tab
                    ? "bg-[#D92D20] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tabMap[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">Bạn chưa có lịch hẹn nào.</p>
              <button 
                onClick={() => navigate("/booking")}
                className="px-5 py-2 bg-[#D92D20] text-white rounded-md hover:bg-red-700 transition"
              >
                Đặt lịch ngay
              </button>
            </div>
          ) : (
            filteredAppointments.map((item) => {
              const status = statusMap[item.status] || { 
                label: item.status, 
                className: "bg-gray-100 text-gray-800",
                dotClass: "bg-gray-500" 
              };
              const apptDate = new Date(item.appointmentTime);
              
              // Extract details from notes if vehicle/tech aren't populated directly
              // Note: The UI shows generic data if actual data is missing to match the screenshot vibe
              const vehicleInfo = item.vehicle ? `${item.vehicle.brand} - ${item.vehicle.licensePlate}` : "Đang cập nhật";
              
              // Find technician name from notes (assuming format KTV mong muốn: Name)
              let techName = "Đang sắp xếp";
              if (item.notes && item.notes.includes("KTV mong muốn:")) {
                const match = item.notes.match(/KTV mong muốn:\s*([^,.]+)/);
                if (match) techName = match[1].trim();
              } else if (item.technician) {
                techName = item.technician.fullname || item.technician.username;
              }

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="w-full md:w-[260px] shrink-0">
                    <img
                      src={getImages(item.id)}
                      alt="Xe bảo trì"
                      className="w-full h-[220px] object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-1">
                          MÃ LỊCH HẸN
                        </p>
                        <h3 className="text-base font-semibold text-[#D92D20]">
                          #{item.id}
                        </h3>
                      </div>

                      <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${status.dotClass}`}></div>
                        {status.label}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-[11px] text-gray-500 mb-1 font-medium">Ngày hẹn</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {apptDate.toLocaleDateString("vi-VN", {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-[11px] text-gray-500 mb-1 font-medium">Khung giờ</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {apptDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-[11px] text-gray-500 mb-1 font-medium">Kỹ thuật viên</p>
                          <p className="text-sm text-gray-900 font-medium">{techName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Bike className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-[11px] text-gray-500 mb-1 font-medium">Xe (Biển số)</p>
                          <p className="text-sm text-gray-900 font-medium">{vehicleInfo}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:col-span-2">
                        <MapPin className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-[11px] text-gray-500 mb-1 font-medium">Chi nhánh</p>
                          <p className="text-sm text-gray-900 font-medium">Quận 10, TP.HCM</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-gray-100">
                      {item.status === "PENDING" && (
                        <button 
                          onClick={() => handleCancel(item.id)}
                          className="px-5 py-2 text-sm font-medium text-[#D92D20] border border-[#D92D20] rounded-md hover:bg-red-50 transition-colors"
                        >
                          Hủy lịch
                        </button>
                      )}
                      <button className="px-5 py-2 text-sm font-medium bg-[#1A1A1A] text-white rounded-md hover:bg-black transition-colors">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
