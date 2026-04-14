import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const UPLOADS_DIRECTORY_PATH = join(process.cwd(), 'uploads');
export const AVATAR_UPLOADS_DIRECTORY_PATH = join(
  UPLOADS_DIRECTORY_PATH,
  'avatars',
);
export const COURSE_THUMBNAIL_UPLOADS_DIRECTORY_PATH = join(
  UPLOADS_DIRECTORY_PATH,
  'course-thumbnails',
);
export const LESSON_ASSET_UPLOADS_DIRECTORY_PATH = join(
  UPLOADS_DIRECTORY_PATH,
  'lesson-assets',
);

export function ensureStorageDirectories() {
  for (const directoryPath of [
    UPLOADS_DIRECTORY_PATH,
    AVATAR_UPLOADS_DIRECTORY_PATH,
    COURSE_THUMBNAIL_UPLOADS_DIRECTORY_PATH,
    LESSON_ASSET_UPLOADS_DIRECTORY_PATH,
  ]) {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }
}
