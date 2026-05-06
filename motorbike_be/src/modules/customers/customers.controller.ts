import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customers.dto';
import { UpdateCustomerDto } from './dto/update-customers.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll() { return this.customersService.findAll(); }

  @Get('search')
  findByPhone(@Query('phone') phone: string) { return this.customersService.findByPhone(phone); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.customersService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCustomerDto) { return this.customersService.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.customersService.remove(id); }
}
