import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customers.dto';
import { UpdateCustomerDto } from './dto/update-customers.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findAll() {
    return this.customersRepository.findAll({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const customer = await this.customersRepository.findByIdWithVehicles(id);
    if (!customer) throw new NotFoundException(`Không tìm thấy khách hàng #${id}`);
    return customer;
  }

  async findByPhone(phone: string) {
    return this.customersRepository.findByPhone(phone);
  }

  async create(dto: CreateCustomerDto) {
    return this.customersRepository.create(dto as any);
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.customersRepository.update(id, dto as any);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.customersRepository.delete(id);
  }
}
