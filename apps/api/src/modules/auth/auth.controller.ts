import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RequestOtpDto,
  VerifyOtpDto,
  GoogleLoginDto,
  AppleLoginDto,
  RefreshTokenDto,
  LogoutDto,
  RevokeSessionDto,
} from './dto';
import { OtpThrottleGuard } from './guards/otp-throttle.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Email/Password ────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── OTP ───────────────────────────────────────────────

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OtpThrottleGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request an OTP code sent to email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.authService.requestOtp(
      dto.email,
      dto.purpose,
    );
    return {
      message: 'OTP sent to your email',
      expiresAt: result.expiresAt,
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OtpThrottleGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Verify OTP and login (creates account if new user)' })
  @ApiResponse({ status: 200, description: 'OTP verified, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 400, description: 'Name required for new users' })
  @ApiResponse({ status: 429, description: 'Too many verification attempts' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpAndLogin(dto);
  }

  // ── Social Login ──────────────────────────────────────

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google ID token (from mobile SDK)' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken, dto.device);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Apple identity token (from mobile SDK)' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid Apple token' })
  async loginWithApple(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(
      dto.identityToken,
      { firstName: dto.firstName, lastName: dto.lastName },
      dto.device,
    );
  }

  // ── Token Management ──────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token / device session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: { user?: { id: string } },
  ) {
    return this.authService.logout(
      dto.refreshToken,
      dto.allDevices,
      req.user?.id,
    );
  }

  // ── Session Management ────────────────────────────────

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active device sessions for current user' })
  @ApiResponse({ status: 200, description: 'Active sessions list' })
  async getSessions(@Req() req: { user: { id: string } }) {
    return this.authService.getDeviceSessions(req.user.id);
  }

  @Post('sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific device session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(
    @Req() req: { user: { id: string } },
    @Body() dto: RevokeSessionDto,
  ) {
    return this.authService.revokeDeviceSession(req.user.id, dto.sessionId);
  }
}
