import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from './create-users.dto';

export const UpdateUserSchema = CreateUserSchema.partial();
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
