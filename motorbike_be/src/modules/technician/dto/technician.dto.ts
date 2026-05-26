import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** DTO cập nhật trạng thái phiếu sửa chữa */
export const UpdateRepairStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'PENDING', 'COMPLETED']),
  technicianNote: z.string().max(1000).optional(),
});
export class UpdateRepairStatusDto extends createZodDto(
  UpdateRepairStatusSchema,
) {}

/** DTO thêm phụ tùng phát sinh vào phiếu sửa chữa */
export const AddItemSchema = z.object({
  sparePartId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  warrantyNote: z.string().max(255).optional(),
});
export class AddItemDto extends createZodDto(AddItemSchema) {}

/** DTO thêm dịch vụ phát sinh vào phiếu sửa chữa */
export const AddServiceSchema = z.object({
  serviceId: z.number().int().positive(),
  appliedPrice: z.number().nonnegative(),
});
export class AddServiceDto extends createZodDto(AddServiceSchema) {}

/** DTO cập nhật KM hiện tại của xe */
export const UpdateKmSchema = z.object({
  currentKm: z.number().int().nonnegative(),
});
export class UpdateKmTechDto extends createZodDto(UpdateKmSchema) {}

/** DTO yêu cầu duyệt báo giá phát sinh — gửi cho lễ tân */
export const ExtraQuoteSchema = z.object({
  reason: z.string().min(1).max(500),
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
      }),
    )
    .default([]),
});
export class ExtraQuoteDto extends createZodDto(ExtraQuoteSchema) {}

/** DTO hoàn thành phiếu sửa chữa */
export const CompleteRepairSchema = z.object({
  technicianNote: z.string().max(1000).optional(),
  warrantyNote: z.string().max(1000).optional(),
  recommendation: z.string().max(1000).optional(),
});
export class CompleteRepairDto extends createZodDto(CompleteRepairSchema) {}
