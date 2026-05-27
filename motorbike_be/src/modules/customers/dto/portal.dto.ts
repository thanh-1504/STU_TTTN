import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/** DTO customer thÃªm xe â€” khÃ´ng nháº­n customerId (láº¥y tá»« JWT) */
export const PortalCreateVehicleSchema = z.object({
  licensePlate: z
    .string()
    .min(4, 'Biá»ƒn sá»‘ tá»‘i thiá»ƒu 4 kÃ½ tá»±')
    .max(20, 'Biá»ƒn sá»‘ tá»‘i Ä‘a 20 kÃ½ tá»±')
    .regex(
      /^[A-Z0-9\-\.]+$/i,
      'Biá»ƒn sá»‘ chá»‰ gá»“m chá»¯, sá»‘, dáº¥u gáº¡ch ngang',
    ),
  brand: z
    .string()
    .min(1, 'TÃªn hÃ£ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng')
    .max(50, 'TÃªn hÃ£ng tá»‘i Ä‘a 50 kÃ½ tá»±'),
  vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG'], {
    message: 'Loáº¡i xe pháº£i lÃ  MANUAL, SCOOTER hoáº·c BIG',
  }),
  model: z.string().max(100).optional(),
  currentKm: z.number().int().min(0, 'Sá»‘ KM khÃ´ng Ä‘Æ°á»£c Ã¢m').optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').max(500).optional(),
  notes: z.string().max(500).optional(),
});

export class PortalCreateVehicleDto extends createZodDto(
  PortalCreateVehicleSchema,
) {}

/** DTO cáº­p nháº­t KM */
export const UpdateKmSchema = z.object({
  currentKm: z
    .number({ message: 'Sá»‘ KM pháº£i lÃ  sá»‘' })
    .int('Sá»‘ KM pháº£i lÃ  sá»‘ nguyÃªn')
    .min(0, 'Sá»‘ KM khÃ´ng Ä‘Æ°á»£c Ã¢m'),
  imageUrl: z
    .union([z.string().url('URL ảnh không hợp lệ').max(500), z.null()])
    .optional(),
});

export class UpdateKmDto extends createZodDto(UpdateKmSchema) {}

/** DTO Ä‘Ã¡nh giÃ¡ */
export const CreatePortalReviewSchema = z.object({
  repairOrderId: z
    .number()
    .int()
    .positive('ID phiáº¿u sá»­a chá»¯a pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng'),
  rating: z
    .number()
    .int('Sao pháº£i lÃ  sá»‘ nguyÃªn')
    .min(1, 'Tá»‘i thiá»ƒu 1 sao')
    .max(5, 'Tá»‘i Ä‘a 5 sao'),
  comment: z.string().max(1000, 'BÃ¬nh luáº­n tá»‘i Ä‘a 1000 kÃ½ tá»±').optional(),
});

export class CreatePortalReviewDto extends createZodDto(
  CreatePortalReviewSchema,
) {}
