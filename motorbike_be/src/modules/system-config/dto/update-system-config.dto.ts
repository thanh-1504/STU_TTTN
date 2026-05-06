import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateSystemConfigSchema } from './create-system-config.dto';

export const UpdateSystemConfigSchema = CreateSystemConfigSchema.partial();
export class UpdateSystemConfigDto extends createZodDto(UpdateSystemConfigSchema) {}
