import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** DTO customer thêm xe — không nhận customerId (lấy từ JWT) */
export const PortalCreateVehicleSchema = z.object({
  licensePlate: z
    .string()
    .min(4, 'Biển số tối thiểu 4 ký tự')
    .max(20, 'Biển số tối đa 20 ký tự')
    .regex(/^[A-Z0-9\-\.]+$/i, 'Biển số chỉ gồm chữ, số, dấu gạch ngang'),
  brand: z
    .string()
    .min(1, 'Tên hãng không được để trống')
    .max(50, 'Tên hãng tối đa 50 ký tự'),
  vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG'], {
    message: 'Loại xe phải là MANUAL, SCOOTER hoặc BIG',
  }),
  model: z.string().max(100).optional(),
  currentKm: z.number().int().min(0, 'Số KM không được âm').optional(),
  notes: z.string().max(500).optional(),
});

export class PortalCreateVehicleDto extends createZodDto(PortalCreateVehicleSchema) {}

/** DTO cập nhật KM */
export const UpdateKmSchema = z.object({
  currentKm: z
    .number({ message: 'Số KM phải là số' })
    .int('Số KM phải là số nguyên')
    .min(0, 'Số KM không được âm'),
});

export class UpdateKmDto extends createZodDto(UpdateKmSchema) {}

/** DTO đánh giá */
export const CreatePortalReviewSchema = z.object({
  repairOrderId: z
    .number()
    .int()
    .positive('ID phiếu sửa chữa phải là số nguyên dương'),
  rating: z
    .number()
    .int('Sao phải là số nguyên')
    .min(1, 'Tối thiểu 1 sao')
    .max(5, 'Tối đa 5 sao'),
  comment: z.string().max(1000, 'Bình luận tối đa 1000 ký tự').optional(),
});

export class CreatePortalReviewDto extends createZodDto(CreatePortalReviewSchema) {}
