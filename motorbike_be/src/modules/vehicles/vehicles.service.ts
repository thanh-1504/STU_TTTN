import { Injectable, NotFoundException } from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehiclesRepository: VehiclesRepository) {}

  async findAll() {
    return this.vehiclesRepository.findAll();
  }

  async findOne(id: number) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) throw new NotFoundException(`Không tìm thấy xe #${id}`);
    return vehicle;
  }

  async findByCustomer(customerId: number) {
    return this.vehiclesRepository.findByCustomerId(customerId);
  }

  async create(dto: CreateVehicleDto) {
    return this.vehiclesRepository.create(dto as any);
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.vehiclesRepository.update(id, dto as any);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.vehiclesRepository.delete(id);
  }
}
