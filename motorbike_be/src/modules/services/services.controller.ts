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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { RoleName } from 'generated/prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-services.dto';
import { ServicesService } from './services.service';

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
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadDir = join(process.cwd(), 'uploads', 'services');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          callback(null, uploadDir);
        },
        filename: (_req, file, callback) => {
          const safeName = file.originalname
            .replace(/\.[^/.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60);
          const fileExt = extname(file.originalname).toLowerCase();

          callback(
            null,
            `${Date.now()}-${safeName || 'service-image'}${fileExt}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Chi ho tro anh JPG, PNG hoac WEBP toi da 5MB',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: any, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('Vui long chon file anh can upload');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return {
      imageUrl: `${baseUrl}/uploads/services/${file.filename}`,
      filename: file.filename,
    };
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
