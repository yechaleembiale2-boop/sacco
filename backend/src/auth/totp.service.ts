import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

@Injectable()
export class TotpService {
  /**
   * Generate a new TOTP secret + QR code for enrollment.
   * Returns the secret (to store) and QR code data URL (for the user's phone).
   */
  async generateSetup(username: string): Promise<TotpSetupResult> {
    const secret = speakeasy.generateSecret({
      name: `IU SACCO (${username})`,
      issuer: 'Injibara University SACCO',
      length: 20,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new InternalServerErrorException('Failed to generate TOTP secret');
    }

    const base32: string = secret.base32;
    const otpauthUrl: string = secret.otpauth_url;

    const qrDataUrl: string = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: base32,
      otpauthUrl,
      qrDataUrl,
    };
  }

  /**
   * Verify a 6-digit TOTP code against a stored secret.
   * Allows a 30-second drift window on either side (window: 1).
   */
  verify(secret: string, code: string): boolean {
    if (!secret || !code || code.length !== 6) {
      return false;
    }
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  /**
   * Throw UnauthorizedException if the code is invalid.
   */
  verifyOrThrow(secret: string, code: string): void {
    if (!this.verify(secret, code)) {
      throw new UnauthorizedException('Invalid MFA code');
    }
  }
}