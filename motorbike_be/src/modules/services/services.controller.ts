import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleName } from 'generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-services.dto';
import { ServicesService } from './services.service';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { imageUploadInterceptorOptions } from '../../shared/upload/image-upload.util';

@Controller('services')
export class ServicesPublicController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAllPublic();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOnePublic(id);
  }
}

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class ServicesAdminController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image', imageUploadInterceptorOptions))
  uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui long chon file anh can upload');
    }

    return this.cloudinaryService.uploadImage(
      file,
      'shop2banh/services',
      'service-image',
    );
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.softDelete(id);
  }
}
