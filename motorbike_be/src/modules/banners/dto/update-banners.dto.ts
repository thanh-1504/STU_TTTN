import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CreateBannerSchema } from './create-banners.dto';

export const UpdateBannerSchema = CreateBannerSchema.partial();
export class UpdateBannerDto extends createZodDto(UpdateBannerSchema) {}
