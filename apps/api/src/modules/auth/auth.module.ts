import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { DeviceSessionService } from './services/device-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleAuthService } from './strategies/google.strategy';
import { AppleAuthService } from './strategies/apple.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('auth.jwtSecret'),
        signOptions: {
          expiresIn: config.get('auth.jwtExpiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    DeviceSessionService,
    JwtStrategy,
    GoogleAuthService,
    AppleAuthService,
  ],
  exports: [AuthService, OtpService, DeviceSessionService],
})
export class AuthModule {}
