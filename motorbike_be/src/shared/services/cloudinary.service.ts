import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUD_NAME');
    this.apiKey = this.configService.get<string>('CLOUD_API_KEY');
    this.apiSecret = this.configService.get<string>('CLOUD_API_KEY_SECRET');

    if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
    }
  }

  async uploadImage(
    file: { originalname: string; buffer: Buffer },
    folder: string,
    fileNamePrefix: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui long chon file anh can upload');
    }

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary chua duoc cau hinh tren server',
      );
    }

    const publicId = this.buildPublicId(file.originalname, fileNamePrefix);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(
              error ??
                new InternalServerErrorException(
                  'Khong the upload anh len Cloudinary',
                ),
            );
            return;
          }

          resolve(uploadResult);
        },
      );

      stream.end(file.buffer);
    });

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      originalFilename: file.originalname,
    };
  }

  private buildPublicId(originalName: string, prefix: string) {
    const safeName = originalName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    return `${prefix}-${Date.now()}-${safeName || 'image'}`;
  }
}
