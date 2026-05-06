import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicles.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll() { return this.vehiclesService.findAll(); }

  @Get('by-customer')
  findByCustomer(@Query('customerId', ParseIntPipe) customerId: number) {
    return this.vehiclesService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.vehiclesService.findOne(id); }

  @Post()
  create(@Body() dto: CreateVehicleDto) { return this.vehiclesService.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.vehiclesService.remove(id); }
}
