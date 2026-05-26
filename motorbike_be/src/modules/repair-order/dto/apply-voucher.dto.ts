import { IsString } from 'class-validator';

export class ApplyVoucherDto {
  @IsString()
  code!: string;
}