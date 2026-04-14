import { existsSync, unlinkSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { resolve } from 'path';
import {
  AVATAR_UPLOADS_DIRECTORY_PATH,
  COURSE_THUMBNAIL_UPLOADS_DIRECTORY_PATH,
  ensureStorageDirectories,
} from './storage.constants';

@Injectable()
export class StorageService {
  constructor() {
    ensureStorageDirectories();
  }

  buildAvatarPublicUrl(fileName: string) {
    return `/uploads/avatars/${fileName}`;
  }

  buildCourseThumbnailPublicUrl(fileName: string) {
    return `/uploads/course-thumbnails/${fileName}`;
  }

  deleteManagedAvatar(avatarUrl?: string | null) {
    this.deleteManagedUpload(
      avatarUrl,
      '/uploads/avatars/',
      AVATAR_UPLOADS_DIRECTORY_PATH,
    );
  }

  deleteManagedCourseThumbnail(thumbnailUrl?: string | null) {
    this.deleteManagedUpload(
      thumbnailUrl,
      '/uploads/course-thumbnails/',
      COURSE_THUMBNAIL_UPLOADS_DIRECTORY_PATH,
    );
  }

  private deleteManagedUpload(
    assetUrl: string | null | undefined,
    publicPrefix: string,
    uploadsDirectoryPath: string,
  ) {
    if (!assetUrl) {
      return;
    }

    const normalizedUrl = assetUrl.replace(/\\/g, '/');
    const prefixIndex = normalizedUrl.indexOf(publicPrefix);

    if (prefixIndex < 0) {
      return;
    }

    const fileName = normalizedUrl.slice(prefixIndex + publicPrefix.length);
    if (!fileName || fileName.includes('..')) {
      return;
    }

    const normalizedUploadsDirectoryPath = resolve(uploadsDirectoryPath);
    const filePath = resolve(uploadsDirectoryPath, fileName);

    if (
      !filePath.startsWith(normalizedUploadsDirectoryPath) ||
      !existsSync(filePath)
    ) {
      return;
    }

    unlinkSync(filePath);
  }
}
