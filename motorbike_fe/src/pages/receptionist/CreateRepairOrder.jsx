import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import {
  createRepairOrder,
  getReceptionistAppointmentDetail,
  getReceptionistCustomers,
  getReceptionistTechnicians,
} from "../../api/receptionistService";
import { getServices } from "../../api/servicesService";
import { getSpareParts } from "../../api/sparePartsService";
import { useNotification } from "../../components/Notification";

const VEHICLE_TYPES = [
  { value: "MANUAL", label: "Xe số" },
  { value: "SCOOTER", label: "Xe tay ga" },
  { value: "BIG", label: "PKL" },
];

const resolveServicePrice = (service, vehicleType) => {
  if (!service) return 0;
  if (vehicleType === "SCOOTER") return Number(service.priceScooter ?? service.priceManual ?? 0);
  if (vehicleType === "BIG") return Number(service.priceMoto ?? service.priceManual ?? 0);
  return Number(service.priceManual ?? 0);
};

export default function CreateRepairOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const appointmentId = appointmentIdParam && !Number.isNaN(Number(appointmentIdParam))
    ? Number(appointmentIdParam)
    : null;
  const hasPrefilledFromAppointment = useRef(false);
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  // Customer
  const [phoneSearch, setPhoneSearch] = useState("");
  const [customer, setCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ customerName: "", address: "" });

  // Vehicle
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: "",
    brand: "",
    vehicleType: "MANUAL",
    model: "",
    currentKm: "",
  });
  const [useNewVehicle, setUseNewVehicle] = useState(false);

  const [technicianId, setTechnicianId] = useState("");
  const [services, setServices] = useState([]); // [{serviceId, appliedPrice, name}]
  const [items, setItems] = useState([]); // [{sparePartId, quantity, unitPrice, name}]

  const [symptoms, setSymptoms] = useState("");
  const [vehicleConditionNote, setVehicleConditionNote] = useState("");
  const [technicianNote, setTechnicianNote] = useState("");
  const [warrantyNote, setWarrantyNote] = useState("");

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: getReceptionistTechnicians,
  });
  const { data: serviceList = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const { data: parts = [] } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: () => getSpareParts(),
  });

  const { data: appointmentDetail } = useQuery({
    queryKey: ["receptionist-appointment-detail", appointmentId],
queryFn: () => getReceptionistAppointmentDetail(appointmentId),
    enabled: Boolean(appointmentId),
    onError: (e) =>
      notify.error(e.response?.data?.message || "Không tải được lịch hẹn"),
  });

  const loadVehiclesForCustomer = async (customerId, preferredVehicleId) => {
    const vs = await api.get(`/vehicles/by-customer?customerId=${customerId}`);
    const list = vs.data || [];
    setVehicles(list);
    if (preferredVehicleId) {
      setVehicleId(String(preferredVehicleId));
    }
    return list;
  };

  useEffect(() => {
    if (!appointmentDetail || hasPrefilledFromAppointment.current) return;

    if (appointmentDetail.customer) {
      setCustomer(appointmentDetail.customer);
      setPhoneSearch(appointmentDetail.customer.phone || "");
      setNewCustomer({ customerName: "", address: "" });
      setUseNewVehicle(false);
      if (appointmentDetail.customer.id) {
        loadVehiclesForCustomer(
          appointmentDetail.customer.id,
          appointmentDetail.vehicle?.id,
        ).catch(() => setVehicles([]));
      }
    }

    if (appointmentDetail.vehicle?.id) {
      setVehicleId(String(appointmentDetail.vehicle.id));
    }

    if (appointmentDetail.technician?.id) {
      setTechnicianId(String(appointmentDetail.technician.id));
    }

    if (appointmentDetail.symptoms) {
      setSymptoms(appointmentDetail.symptoms);
    }

    const apptServices = Array.isArray(appointmentDetail.services)
      ? appointmentDetail.services
          .map((s) => s.service || s)
          .filter(Boolean)
      : [];

    if (apptServices.length > 0) {
      const vehicleType = appointmentDetail.vehicle?.vehicleType;
      setServices(
        apptServices.map((svc) => ({
          serviceId: svc.id,
          appliedPrice: resolveServicePrice(svc, vehicleType),
          name: svc.serviceName,
        })),
      );
    }

    hasPrefilledFromAppointment.current = true;
  }, [appointmentDetail]);

  const searchCustomer = async () => {
    if (!phoneSearch.trim()) return;
    try {
      const list = await getReceptionistCustomers(phoneSearch.trim());
      if (list.length === 0) {
        setCustomer(null);
        setVehicles([]);
        notify.warning("Không tìm thấy khách. Hãy điền tên để tạo nhanh.");
        return;
      }
      const c = list[0];
      setCustomer(c);
      setUseNewVehicle(false);
      await loadVehiclesForCustomer(c.id);
      notify.success(`Đã tìm thấy: ${c.customerName}`);
    } catch (e) {
      notify.error(e.response?.data?.message || "Lỗi tìm khách");
    }
  };

  const addService = (s) => {
    if (services.find((x) => x.serviceId === s.id)) return;
    setServices([
      ...services,
      {
        serviceId: s.id,
        appliedPrice: Number(s.priceManual),
        name: s.serviceName,
      },
    ]);
  };

  const addItem = (p) => {
    if (items.find((x) => x.sparePartId === p.id)) return;
    setItems([
      ...items,
      {
sparePartId: p.id,
        quantity: 1,
        unitPrice: Number(p.sellingPrice),
        name: p.partName,
        stock: p.stockQuantity,
      },
    ]);
  };

  const total =
    services.reduce((s, x) => s + Number(x.appliedPrice), 0) +
    items.reduce((s, x) => s + Number(x.unitPrice) * x.quantity, 0);

  const submitM = useMutation({
    mutationFn: createRepairOrder,
    onSuccess: () => {
      notify.success("Tạo phiếu thành công");
      setTimeout(() => navigate("/receptionist/repair-orders"), 800);
    },
    onError: (e) => notify.error(e.response?.data?.message || "Lỗi tạo phiếu"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer && !newCustomer.customerName) {
      notify.error("Cần khách hàng");
      return;
    }
    if (!useNewVehicle && !vehicleId) {
      notify.error("Cần chọn xe");
      return;
    }
    if (useNewVehicle && !newVehicle.licensePlate) {
      notify.error("Cần biển số xe");
      return;
    }
    if (!technicianId) {
      notify.error("Cần phân công KTV");
      return;
    }

    const payload = {
      ...(appointmentId ? { appointmentId } : {}),
      technicianId: Number(technicianId),
      services: services.map((s) => ({
        serviceId: s.serviceId,
        appliedPrice: s.appliedPrice,
      })),
      items: items.map((i) => ({
        sparePartId: i.sparePartId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      symptoms: symptoms || undefined,
      vehicleConditionNote: vehicleConditionNote || undefined,
      technicianNote: technicianNote || undefined,
      warrantyNote: warrantyNote || undefined,
    };

    if (customer) payload.customerId = customer.id;
    else
      payload.customer = {
        phone: phoneSearch.trim(),
        customerName: newCustomer.customerName,
        address: newCustomer.address || undefined,
      };

    if (useNewVehicle)
      payload.vehicle = {
        licensePlate: newVehicle.licensePlate,
        brand: newVehicle.brand,
        vehicleType: newVehicle.vehicleType,
        model: newVehicle.model || undefined,
        currentKm: newVehicle.currentKm ? Number(newVehicle.currentKm) : undefined,
      };
    else payload.vehicleId = Number(vehicleId);

    submitM.mutate(payload);
  };

  return (
    <div className="bg-[#fbf9f8] min-h-full">
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      <h1 className="text-xl font-bold mb-6">Lập phiếu sửa chữa</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Khách hàng */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">1. Khách hàng</h3>
          <div className="flex gap-2">
            <input
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="SĐT khách"
className="border p-2 rounded flex-1"
            />
            <button type="button" onClick={searchCustomer} className="bg-zinc-800 text-white px-4 rounded">
              Tìm
            </button>
          </div>
          {customer ? (
            <p className="text-emerald-700 text-sm">
              ✓ {customer.customerName} ({customer.phone})
            </p>
          ) : (
            phoneSearch && (
              <div className="grid md:grid-cols-2 gap-2">
                <input
                  placeholder="Tên khách"
                  value={newCustomer.customerName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  placeholder="Địa chỉ (tùy chọn)"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="border p-2 rounded"
                />
              </div>
            )
          )}
        </div>

        {/* Xe */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">2. Xe</h3>
          <div className="flex gap-4 text-sm">
            <label>
              <input
                type="radio"
                checked={!useNewVehicle}
                onChange={() => setUseNewVehicle(false)}
              />{" "}
              Xe đã có
            </label>
            <label>
              <input
                type="radio"
                checked={useNewVehicle}
                onChange={() => setUseNewVehicle(true)}
              />{" "}
              Tạo xe mới
            </label>
          </div>
          {!useNewVehicle ? (
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} · {v.brand} {v.model || ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              <input
                placeholder="Biển số *"
                value={newVehicle.licensePlate}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, licensePlate: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="Hãng xe *"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                className="border p-2 rounded"
              />
              <select
                value={newVehicle.vehicleType}
onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicleType: e.target.value })
                }
                className="border p-2 rounded"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Số km"
                type="number"
                value={newVehicle.currentKm}
                onChange={(e) => setNewVehicle({ ...newVehicle, currentKm: e.target.value })}
                className="border p-2 rounded"
              />
            </div>
          )}
        </div>

        {/* KTV */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">3. Kỹ thuật viên *</h3>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">-- Chọn KTV --</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullname}
              </option>
            ))}
          </select>
        </div>

        {/* Dịch vụ */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">4. Dịch vụ</h3>
          <select
            onChange={(e) => {
              const s = serviceList.find((x) => x.id === Number(e.target.value));
              if (s) addService(s);
              e.target.value = "";
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">+ Thêm dịch vụ</option>
            {serviceList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceName} — {Number(s.priceManual).toLocaleString("vi-VN")}đ
              </option>
            ))}
          </select>
          {services.length > 0 && (
            <table className="w-full text-sm">
              <tbody>
                {services.map((s, idx) => (
                  <tr key={s.serviceId} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={s.appliedPrice}
                        onChange={(e) => {
                          const n = [...services];
                          n[idx].appliedPrice = Number(e.target.value);
                          setServices(n);
                        }}
                        className="border p-1 rounded w-32 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
onClick={() => setServices(services.filter((_, i) => i !== idx))}
                        className="text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Phụ tùng */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">5. Phụ tùng</h3>
          <select
            onChange={(e) => {
              const p = parts.find((x) => x.id === Number(e.target.value));
              if (p) addItem(p);
              e.target.value = "";
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">+ Thêm phụ tùng</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partName} (Tồn: {p.stockQuantity}) — {Number(p.sellingPrice).toLocaleString("vi-VN")}đ
              </option>
            ))}
          </select>
          {items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Tên</th>
                  <th className="p-2 text-center">SL</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Thành tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.sparePartId} className="border-t">
                    <td className="p-2">{it.name}</td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        max={it.stock}
                        value={it.quantity}
                        onChange={(e) => {
                          const n = [...items];
                          n[idx].quantity = Math.max(1, Number(e.target.value));
                          setItems(n);
                        }}
                        className="border p-1 rounded w-16 text-center"
                      />
                    </td>
                    <td className="p-2 text-right">
                      {Number(it.unitPrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {(it.unitPrice * it.quantity).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="text-red-600"
                      >
                        ✕
                      </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Ghi chú */}
        <div className="bg-white border rounded p-5 space-y-3">
          <h3 className="font-bold text-zinc-800">6. Ghi chú</h3>
          <textarea
            placeholder="Triệu chứng / yêu cầu khách"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="border p-2 rounded w-full"
            rows={2}
          />
          <textarea
            placeholder="Tình trạng vỏ xe lúc tiếp nhận"
            value={vehicleConditionNote}
            onChange={(e) => setVehicleConditionNote(e.target.value)}
            className="border p-2 rounded w-full"
            rows={2}
          />
          <textarea
            placeholder="Ghi chú kỹ thuật"
            value={technicianNote}
            onChange={(e) => setTechnicianNote(e.target.value)}
            className="border p-2 rounded w-full"
            rows={2}
          />
          <textarea
            placeholder="Ghi chú bảo hành"
            value={warrantyNote}
            onChange={(e) => setWarrantyNote(e.target.value)}
            className="border p-2 rounded w-full"
            rows={2}
          />
        </div>

        {/* Tổng + Submit */}
        <div className="bg-white border rounded p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-zinc-500">Tổng cộng</p>
            <p className="text-2xl font-bold text-red-700">
              {total.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitM.isPending}
              className="bg-red-700 text-white px-6 py-2 rounded disabled:bg-red-400"
            >
              {submitM.isPending ? "Đang lưu..." : "Tạo phiếu"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}