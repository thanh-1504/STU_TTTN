import { IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from 'generated/prisma/client';


export class PayDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;
}