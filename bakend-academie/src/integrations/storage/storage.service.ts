import { existsSync, unlinkSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { resolve } from 'path';
import {
  AVATAR_UPLOADS_DIRECTORY_PATH,
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

  deleteManagedAvatar(avatarUrl?: string | null) {
    if (!avatarUrl) {
      return;
    }

    const normalizedUrl = avatarUrl.replace(/\\/g, '/');
    const avatarPrefix = '/uploads/avatars/';
    const prefixIndex = normalizedUrl.indexOf(avatarPrefix);

    if (prefixIndex < 0) {
      return;
    }

    const fileName = normalizedUrl.slice(prefixIndex + avatarPrefix.length);
    if (!fileName || fileName.includes('..')) {
      return;
    }

    const avatarDirectoryPath = resolve(AVATAR_UPLOADS_DIRECTORY_PATH);
    const filePath = resolve(AVATAR_UPLOADS_DIRECTORY_PATH, fileName);

    if (!filePath.startsWith(avatarDirectoryPath) || !existsSync(filePath)) {
      return;
    }

    unlinkSync(filePath);
  }
}
