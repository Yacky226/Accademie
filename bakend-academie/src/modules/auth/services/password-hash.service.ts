import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordHashService {
  private static readonly ITERATIONS = 120_000;
  private static readonly KEY_LENGTH = 32;
  private static readonly DIGEST = 'sha256';

  // This service only handles password and token hashing concerns.
  hash(value: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = pbkdf2Sync(
      value,
      salt,
      PasswordHashService.ITERATIONS,
      PasswordHashService.KEY_LENGTH,
      PasswordHashService.DIGEST,
    ).toString('hex');

    return [
      salt,
      PasswordHashService.ITERATIONS,
      PasswordHashService.KEY_LENGTH,
      PasswordHashService.DIGEST,
      derived,
    ].join(':');
  }

  verify(rawValue: string, storedHash: string): boolean {
    const [salt, iterationsText, keyLengthText, digest, hashHex] = storedHash.split(':');
    if (!salt || !iterationsText || !keyLengthText || !digest || !hashHex) {
      return false;
    }

    const iterations = Number(iterationsText);
    const keyLength = Number(keyLengthText);
    if (!Number.isFinite(iterations) || !Number.isFinite(keyLength)) {
      return false;
    }

    const recalculatedHash = pbkdf2Sync(rawValue, salt, iterations, keyLength, digest).toString('hex');

    const sourceBuffer = Buffer.from(hashHex, 'hex');
    const targetBuffer = Buffer.from(recalculatedHash, 'hex');
    if (sourceBuffer.length !== targetBuffer.length) {
      return false;
    }

    return timingSafeEqual(sourceBuffer, targetBuffer);
  }
}
