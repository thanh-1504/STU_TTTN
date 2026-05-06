import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateSystemConfigSchema = z.object({
  configKey: z.string().max(100).describe('Khoá cấu hình (unique)'),
  configValue: z.string().describe('Giá trị cấu hình'),
  description: z.string().max(255).optional().describe('Mô tả cấu hình'),
});

export class CreateSystemConfigDto extends createZodDto(CreateSystemConfigSchema) {}
