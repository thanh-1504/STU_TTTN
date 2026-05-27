import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const IMAGE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024;

export const imageUploadInterceptorOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: IMAGE_UPLOAD_MAX_SIZE,
  },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new BadRequestException('Chi ho tro anh JPG, PNG hoac WEBP toi da 5MB'),
        false,
      );
      return;
    }

    callback(null, true);
  },
};
