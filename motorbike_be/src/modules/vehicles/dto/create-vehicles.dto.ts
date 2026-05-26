import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateVehicleSchema = z.object({
  licensePlate: z.string().max(20).describe('Biển số xe'),
  brand: z.string().max(50).describe('Hãng xe'),
  vehicleType: z.enum(['MANUAL', 'SCOOTER', 'BIG']).describe('Loại xe'),
  model: z.string().max(100).optional().describe('Model xe'),
  currentKm: z.coerce.number().int().optional().describe('Số km hiện tại').default(0),
  notes: z.string().optional().describe('Ghi chú'),
  customerId: z.number().int().positive().describe('ID khách hàng'),
});

export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
