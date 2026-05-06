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
  Query,
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
import { BlogService } from './blog.service';
import {
  CreateBlogCategoryDto,
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog.dto';

@Controller('blog')
export class BlogPublicController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  findPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blogService.findPublishedPage(
      page ? Number(page) : 1,
      limit ? Number(limit) : 5,
    );
  }

  @Get('latest')
  findLatest(@Query('limit') limit?: string) {
    return this.blogService.findLatestPublished(limit ? Number(limit) : 5);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}

@Controller('admin/blog-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class BlogCategoryAdminController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  findAll() {
    return this.blogService.findAllCategories();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.deleteCategory(id);
  }
}

@Controller('admin/blog-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
export class BlogPostAdminController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.blogService.findAll(
      status,
      categoryId ? +categoryId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.findOne(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadDir = join(process.cwd(), 'uploads', 'blog');
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

          callback(null, `${Date.now()}-${safeName || 'blog-image'}${fileExt}`);
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
      imageUrl: `${baseUrl}/uploads/blog/${file.filename}`,
      filename: file.filename,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blogService.update(id, dto);
  }

  @Patch(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.publish(id);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.archive(id);
  }
}
