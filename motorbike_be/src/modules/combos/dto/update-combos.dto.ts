import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateComboSchema } from './create-combos.dto';

export const UpdateComboSchema = CreateComboSchema.partial();

export class UpdateComboDto extends createZodDto(UpdateComboSchema) {}
