import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const UPLOADS_DIRECTORY_PATH = join(process.cwd(), 'uploads');
export const AVATAR_UPLOADS_DIRECTORY_PATH = join(
  UPLOADS_DIRECTORY_PATH,
  'avatars',
);

export function ensureStorageDirectories() {
  for (const directoryPath of [
    UPLOADS_DIRECTORY_PATH,
    AVATAR_UPLOADS_DIRECTORY_PATH,
  ]) {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }
}
