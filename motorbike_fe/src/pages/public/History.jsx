import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle2,
  Home,
  LogOut,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Star,
  ToolCase,
  UserCircle,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyAppointments } from "../../api/appointmentsService";
import {
  createReview,
  getMyRepairOrders,
  getRepairOrderDetail,
} from "../../api/portalService";
import CustomerPortal from "./CustomerPortal";

const repairStatusMap = {
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-yellow-100 text-yellow-700",
  },
  IN_PROGRESS: {
    label: "Đang sửa chữa",
    className: "bg-blue-100 text-blue-700",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "bg-green-100 text-green-700",
  },
  PAID: {
    label: "Đã hoàn thành",
    className: "bg-blue-100 text-blue-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-gray-100 text-gray-600",
  },
};

const appointmentStatusMap = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const formatDate = (value) => {
  if (!value) return "Đang cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  const date = formatDate(value);
  const time = formatTime(value);

  if (date === "Đang cập nhật") return date;
  return time ? `${date} • ${time}` : date;
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const getRepairStatusMeta = (status) =>
  repairStatusMap[status] || {
    label: status || "Đang cập nhật",
    className: "bg-gray-100 text-gray-700",
  };

const getRepairDisplayData = (order) => {
  const vehicle = order.vehicle || {};
  const customer = order.customer || {};
  const repairMoment =
    order.completedAt ||
    order.updatedAt ||
    order.createdAt ||
    order.repairDate ||
    order.repairTime;

  return {
    id: order.id,
    repairTime: formatDate(repairMoment),
    repairHour: formatTime(repairMoment),
    title:
      order.serviceName ||
      order.title ||
      order.description ||
      `Phiếu sửa chữa #${order.id}`,
    customerName:
      customer.fullname ||
      customer.fullName ||
      customer.username ||
      order.customerName ||
      order.name ||
      "Đang cập nhật",
    vehicleName:
      [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
      vehicle.name ||
      order.vehicleName ||
      "Đang cập nhật",
    licensePlate: vehicle.licensePlate || order.licensePlate || "Đang cập nhật",
    totalCost: formatCurrency(order.totalAmount || order.totalCost),
    status: getRepairStatusMeta(order.status),
  };
};

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("my-gara");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["myAppointments"],
    queryFn: getMyAppointments,
    enabled: activeTab === "booking-history",
  });

  const { data: repairOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["myRepairOrders"],
    queryFn: getMyRepairOrders,
    enabled: activeTab === "repair-history" && !selectedOrderId,
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["repairOrderDetail", selectedOrderId],
    queryFn: () => getRepairOrderDetail(selectedOrderId),
    enabled: Boolean(selectedOrderId),
  });

  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      alert("Cảm ơn bạn đã gửi đánh giá!");
      queryClient.invalidateQueries({
        queryKey: ["repairOrderDetail", selectedOrderId],
      });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.");
    },
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Vui lòng chọn số sao!");
      return;
    }

    reviewMutation.mutate({
      repairOrderId: selectedOrderId,
      rating,
      comment,
    });
  };

  const renderBookingHistory = () => {
    if (isLoadingAppointments) {
      return <div className="py-10 text-center">Đang tải lịch hẹn...</div>;
    }

    if (appointments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <CalendarClock size={48} className="text-gray-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Chưa có lịch đặt trước</h3>
          <p className="max-w-md text-gray-500">
            Bạn hiện không có lịch hẹn bảo dưỡng nào sắp tới.
          </p>
          <button
            onClick={() => navigate("/booking")}
            className="mt-6 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Đặt lịch ngay
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {appointments.map((apt) => {
          const appointmentMoment =
            apt.appointmentTime || apt.appointmentDate || apt.createdAt;

          return (
            <div
              key={apt.id}
              className="rounded-xl border bg-white p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <CalendarClock size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {apt.serviceName || "Hẹn bảo dưỡng xe"}
                    </h4>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDateTime(appointmentMoment)}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          apt.status === "CONFIRMED"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        {appointmentStatusMap[apt.status] || apt.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRepairList = () => {
    if (isLoadingOrders) {
      return <div className="py-10 text-center">Đang tải lịch sử sửa chữa...</div>;
    }

    if (repairOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <ToolCase size={48} className="text-gray-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Chưa có lịch sử sửa chữa</h3>
          <p className="text-gray-500">
            Hóa đơn và chi tiết bảo dưỡng xe của bạn sẽ hiển thị tại đây.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {repairOrders.map((order) => {
          const item = getRepairDisplayData(order);

          return (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
              className="group w-full rounded-xl border border-[#E0E0E0] bg-white p-4 text-left transition-all hover:border-[#D73417] hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm text-[#333333]">
                    {item.repairHour
                      ? `${item.repairTime} • ${item.repairHour}`
                      : item.repairTime}
                  </p>
                  <h3 className="text-lg font-semibold text-[#1b1c1c] transition-colors group-hover:text-[#D73417]">
                    {item.title}
                  </h3>
                </div>

                <span
                  className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${item.status.className}`}
                >
                  {item.status.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#333333] md:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                    Tên khách hàng
                  </p>
                  <p className="font-medium">{item.customerName}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                    Tên xe
                  </p>
                  <p className="font-medium">{item.vehicleName}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                    Biển số xe
                  </p>
                  <p className="font-medium">{item.licensePlate}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#E0E0E0] pt-3">
                <span className="text-sm text-[#333333]">Tổng chi phí:</span>
                <span className="text-[17px] font-bold leading-[24px] text-[#D73417]">
                  {item.totalCost}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderRepairDetail = () => {
    if (isLoadingDetail) {
      return <div className="py-10 text-center">Đang tải chi tiết phiếu...</div>;
    }

    if (!orderDetail) return null;

    const parts = orderDetail.repairOrderParts || [];
    const isReviewed = Boolean(orderDetail.review);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-xl border bg-white shadow-sm duration-300">
        <div className="flex items-center gap-4 border-b bg-gray-50 p-4">
          <button
            onClick={() => setSelectedOrderId(null)}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-bold">Chi tiết phiếu #{orderDetail.id}</h3>
            <p className="text-sm text-gray-500">
              Ngày tạo: {formatDate(orderDetail.createdAt)}
            </p>
          </div>
        </div>

        <div className="space-y-8 p-6">
          <section>
            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <Wrench size={20} className="text-red-600" />
              Chi tiết phụ tùng đã thay thế
            </h4>

            {parts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="border-b p-3">Tên phụ tùng</th>
                      <th className="border-b p-3 text-center">SL</th>
                      <th className="border-b p-3 text-right">Đơn giá</th>
                      <th className="border-b p-3 text-center">Bảo hành</th>
                      <th className="border-b p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, index) => {
                      const name = part.sparePart?.name || "N/A";
                      const qty = part.quantity || 1;
                      const price = part.unitPrice || 0;
                      const warranty = part.sparePart?.warrantyMonths
                        ? `${part.sparePart.warrantyMonths} tháng`
                        : "Không BH";

                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{name}</td>
                          <td className="p-3 text-center">{qty}</td>
                          <td className="p-3 text-right">{formatCurrency(price)}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                              <ShieldCheck size={14} />
                              {warranty}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-800">
                            {formatCurrency(qty * price)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">
                Không có phụ tùng nào được ghi nhận thay thế trong phiếu này.
              </p>
            )}

            <div className="mt-4 flex justify-end text-lg">
              <div className="flex min-w-[300px] justify-between gap-4 rounded-lg border bg-gray-50 p-4">
                <span className="font-semibold text-gray-600">
                  Tổng cộng (Phụ tùng + Dịch vụ):
                </span>
                <span className="font-black text-red-600">
                  {formatCurrency(orderDetail.totalAmount || 0)}
                </span>
              </div>
            </div>
          </section>

          {orderDetail.status === "PAID" && (
            <section className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              {isReviewed ? (
                <div className="py-4 text-center">
                  <CheckCircle2 size={40} className="mx-auto mb-2 text-green-500" />
                  <h4 className="font-bold text-gray-800">
                    Cảm ơn bạn đã đánh giá!
                  </h4>
                  <p className="text-sm text-gray-500">
                    Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.
                  </p>

                  {orderDetail.review?.rating && (
                    <div className="mt-3 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={
                            star <= orderDetail.review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-800">
                    <MessageSquare size={20} className="text-blue-600" />
                    Đánh giá dịch vụ
                  </h4>
                  <p className="mb-4 text-sm text-gray-500">
                    Bạn cảm thấy hài lòng với dịch vụ của phiếu sửa chữa này chứ?
                  </p>

                  <div className="mb-4 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={32}
                          className={`${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          } transition-colors`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-semibold text-gray-600">
                      {rating === 0 ? "Chưa chọn sao" : `${rating}/5 sao`}
                    </span>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ thêm trải nghiệm của bạn (không bắt buộc)..."
                    className="mb-4 min-h-[100px] w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || reviewMutation.isPending}
                    className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${
                      rating === 0 || reviewMutation.isPending
                        ? "cursor-not-allowed bg-gray-200 text-gray-400"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {reviewMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "my-gara":
        return (
          <div className="animate-in fade-in duration-300">
            <CustomerPortal />
          </div>
        );

      case "order-history":
        return (
          <div className="animate-in fade-in rounded-xl border bg-white p-6 shadow-sm duration-300">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <ShoppingBag className="text-red-600" />
              Lịch sử mua hàng
            </h2>
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-gray-500">
              <ShoppingBag size={40} className="mb-3 text-gray-300" />
              <p>Chưa có đơn hàng phụ kiện/đồ chơi nào được ghi nhận.</p>
            </div>
          </div>
        );

      case "booking-history":
        return (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="flex items-center gap-3 text-2xl font-black uppercase text-gray-800">
                <CalendarClock className="text-red-600" />
                Lịch sử đặt lịch
              </h2>
              <p className="mt-1 text-gray-500">
                Theo dõi các lịch hẹn mà bạn đã đặt trước.
              </p>
            </div>
            {renderBookingHistory()}
          </div>
        );

      case "repair-history":
      default:
        return (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-black uppercase text-gray-800">
                  <Wrench className="text-red-600" />
                  Lịch sử sửa chữa
                </h2>
                <p className="mt-1 text-gray-500">
                  Quản lý hóa đơn, bảo hành và đánh giá.
                </p>
              </div>
            </div>
            {selectedOrderId ? renderRepairDetail() : renderRepairList()}
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pt-8 pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row">
        <aside className="w-full flex-shrink-0 md:w-64">
          <div className="sticky top-24 flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
            <button
              onClick={() => navigate("/")}
              className="flex w-full items-center justify-center gap-2 border-b bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
            >
              <Home size={16} />
              Quay lại trang chủ
            </button>

            <div className="flex-shrink-0 border-b bg-[#0f172a] p-6 text-center text-white">
              <UserCircle
                size={64}
                className="mx-auto mb-3 text-gray-300"
                strokeWidth={1}
              />
              <h3 className="text-lg font-bold">Khách hàng</h3>
            </div>

            <nav className="mt-2 flex-1 space-y-1 overflow-y-auto p-2">
              <button
                onClick={() => {
                  setActiveTab("my-gara");
                  setSelectedOrderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "my-gara"
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Car size={18} />
                My Gara
              </button>
              <button
                onClick={() => {
                  setActiveTab("order-history");
                  setSelectedOrderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "order-history"
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ShoppingBag size={18} />
                Lịch sử mua hàng
              </button>
              <button
                onClick={() => {
                  setActiveTab("booking-history");
                  setSelectedOrderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "booking-history"
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CalendarClock size={18} />
                Lịch sử đặt lịch
              </button>
              <button
                onClick={() => {
                  setActiveTab("repair-history");
                  setSelectedOrderId(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "repair-history"
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ToolCase size={18} />
                Lịch sử sửa chữa
              </button>
            </nav>

           
          </div>
        </aside>

        <main className="w-full flex-1 overflow-hidden">{renderActiveTabContent()}</main>
      </div>
    </div>
  );
}
