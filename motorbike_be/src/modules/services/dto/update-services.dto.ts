import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateServiceSchema } from './create-services.dto';

export const UpdateServiceSchema = CreateServiceSchema.partial();

export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {}
