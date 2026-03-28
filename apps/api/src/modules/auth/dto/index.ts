import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
  Length,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Registration ────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @ApiPropertyOptional({ example: 'hi' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

// ── Email/Password Login ────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ description: 'Device info for session tracking' })
  @IsOptional()
  device?: DeviceInfoDto;
}

// ── OTP ─────────────────────────────────────────────────────

export class RequestOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({
    example: 'LOGIN',
    enum: ['LOGIN', 'VERIFY_EMAIL', 'RESET_PASSWORD'],
  })
  @IsOptional()
  @IsIn(['LOGIN', 'VERIFY_EMAIL', 'RESET_PASSWORD'])
  purpose?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  code: string;

  @ApiPropertyOptional({
    example: 'LOGIN',
    enum: ['LOGIN', 'VERIFY_EMAIL', 'RESET_PASSWORD'],
  })
  @IsOptional()
  @IsIn(['LOGIN', 'VERIFY_EMAIL', 'RESET_PASSWORD'])
  purpose?: string;

  @ApiPropertyOptional({ description: 'User name (required for first-time OTP login)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Device info for session tracking' })
  @IsOptional()
  device?: DeviceInfoDto;
}

// ── Social Login ────────────────────────────────────────────

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token from client SDK' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ description: 'Device info for session tracking' })
  @IsOptional()
  device?: DeviceInfoDto;
}

export class AppleLoginDto {
  @ApiProperty({ description: 'Apple identity token from client SDK' })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiPropertyOptional({ description: 'First name (only available on first Apple sign-in)' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name (only available on first Apple sign-in)' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Device info for session tracking' })
  @IsOptional()
  device?: DeviceInfoDto;
}

// ── Token Management ────────────────────────────────────────

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiPropertyOptional({ description: 'If true, log out all devices' })
  @IsOptional()
  allDevices?: boolean;
}

// ── Device Info ─────────────────────────────────────────────

export class DeviceInfoDto {
  @ApiProperty({ example: 'device-uuid-here' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'iOS' })
  @IsOptional()
  @IsString()
  deviceOS?: string;

  @ApiPropertyOptional({ example: '17.4' })
  @IsOptional()
  @IsString()
  deviceOSVersion?: string;

  @ApiPropertyOptional({ example: '0.1.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

// ── Session Management ──────────────────────────────────────

export class RevokeSessionDto {
  @ApiProperty({ description: 'Device session ID to revoke' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
