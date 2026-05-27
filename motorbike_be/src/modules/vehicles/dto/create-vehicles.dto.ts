import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateVehicleSchema = z.object({
  licensePlate: z.string().max(20).describe('Biá»ƒn sá»‘ xe'),
  brand: z.string().max(50).describe('HÃ£ng xe'),
  vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG']).describe('Loáº¡i xe'),
  model: z.string().max(100).optional().describe('Model xe'),
  currentKm: z.coerce
    .number()
    .int()
    .optional()
    .describe('Sá»‘ km hiá»‡n táº¡i')
    .default(0),
  imageUrl: z.string().url('URL ảnh không hợp lệ').max(500).optional(),
  notes: z.string().optional().describe('Ghi chÃº'),
  customerId: z.number().int().positive().describe('ID khÃ¡ch hÃ ng'),
});

export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
