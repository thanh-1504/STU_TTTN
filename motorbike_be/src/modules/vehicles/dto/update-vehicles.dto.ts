import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateVehicleSchema } from './create-vehicles.dto';

export const UpdateVehicleSchema = CreateVehicleSchema.partial();
export class UpdateVehicleDto extends createZodDto(UpdateVehicleSchema) {}
