import { TotpService } from './totp.service';
import * as speakeasy from 'speakeasy';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    service = new TotpService();
  });

  it('generates a valid TOTP secret', async () => {
    const result = await service.generateSetup('testuser');

    expect(result.secret).toBeTruthy();
    expect(result.secret.length).toBeGreaterThan(0);
    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(result.qrDataUrl).toContain('data:image/png;base64,');
  });

  it('verifies a valid code', () => {
    const secret = 'JBSWY3DPEHPK3PXP'; // test secret

    // Generate the current valid code from the secret
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    expect(service.verify(secret, code)).toBe(true);
  });

  it('rejects an invalid code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(service.verify(secret, '000000')).toBe(false);
  });

  it('rejects an empty code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(service.verify(secret, '')).toBe(false);
  });

  it('rejects a code shorter than 6 digits', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(service.verify(secret, '123')).toBe(false);
  });

  it('verifyOrThrow throws on invalid code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(() => service.verifyOrThrow(secret, '000000')).toThrow(
      'Invalid MFA code',
    );
  });

  it('verifyOrThrow passes on valid code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });
    expect(() => service.verifyOrThrow(secret, code)).not.toThrow();
  });
});