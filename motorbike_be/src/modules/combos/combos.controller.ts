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
import { CombosService } from './combos.service';
import { Query } from '@nestjs/common';
import { CreateComboDto } from './dto/create-combos.dto';
import { UpdateComboDto } from './dto/update-combos.dto';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { imageUploadInterceptorOptions } from '../../shared/upload/image-upload.util';

@Controller('combos')
export class CombosPublicController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.combosService.findAllPublic(
      take ? parseInt(take, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
      sortBy,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.combosService.findOnePublic(id);
  }
}

@Controller('admin/combos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class CombosAdminController {
  constructor(
    private readonly combosService: CombosService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll() {
    return this.combosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.combosService.findOne(id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image', imageUploadInterceptorOptions))
  uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui long chon file anh can upload');
    }

    return this.cloudinaryService.uploadImage(
      file,
      'shop2banh/combos',
      'combo-image',
    );
  }

  @Post()
  create(@Body() dto: CreateComboDto) {
    return this.combosService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComboDto,
  ) {
    return this.combosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.combosService.softDelete(id);
  }
}
