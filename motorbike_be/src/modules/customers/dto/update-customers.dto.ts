import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateCustomerSchema } from './create-customers.dto';

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}
