import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTO tạo phiếu sửa chữa (lễ tân).
 * - customer & vehicle: hoặc dùng id có sẵn, hoặc tạo nhanh bằng phone/licensePlate
 * - receptionistId được lấy từ JWT
 */
export const CreateRepairOrderSchema = z
  .object({
    appointmentId: z.number().int().positive().optional(),

    // Khách hàng — bắt buộc 1 trong 2
    customerId: z.number().int().positive().optional(),
    customer: z
      .object({
        phone: z.string().min(8).max(15),
        customerName: z.string().min(1).max(100),
        address: z.string().max(255).optional(),
      })
      .optional(),

    // Xe — bắt buộc 1 trong 2
    vehicleId: z.number().int().positive().optional(),
    vehicle: z
      .object({
        licensePlate: z.string().min(2).max(20),
        brand: z.string().min(1).max(50),
        vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG']),
        model: z.string().max(100).optional(),
        currentKm: z.number().int().nonnegative().optional(),
        notes: z.string().max(500).optional(),
      })
      .optional(),

    technicianId: z.number().int().positive(),

    services: z
      .array(
        z.object({
          serviceId: z.number().int().positive(),
          appliedPrice: z.number().nonnegative(),
        }),
      )
      .default([]),

    items: z
      .array(
        z.object({
          sparePartId: z.number().int().positive(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().nonnegative(),
          warrantyNote: z.string().max(255).optional(),
        }),
      )
      .default([]),

    symptoms: z.string().max(1000).optional(),
    vehicleConditionNote: z.string().max(1000).optional(),
    technicianNote: z.string().max(1000).optional(),
    warrantyNote: z.string().max(1000).optional(),
  })
  .refine((d) => d.customerId || d.customer, {
    message: 'Cần customerId hoặc thông tin khách hàng mới',
    path: ['customerId'],
  })
  .refine((d) => d.vehicleId || d.vehicle, {
    message: 'Cần vehicleId hoặc thông tin xe mới',
    path: ['vehicleId'],
  });

export class CreateRepairOrderDto extends createZodDto(
  CreateRepairOrderSchema,
) {}
