import { Injectable } from '@nestjs/common';
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
  VerifyTokenRequest,
  VerifyTokenResponse,
} from '@voice-chat/contracts/gen/auth';
import { RpcException } from '@nestjs/microservices';

import { UserClientGrpc } from '../user/user.grpc';

import bcrypt from 'bcrypt';
import { PassportService } from '../passport/passport.service';
import { RpcStatus } from '@voice-chat/common';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userClient: UserClientGrpc,
    private readonly passportService: PassportService,
  ) {}

  async loginUser(dto: LoginRequest): Promise<LoginResponse> {
    const { email, password } = dto;

    const { user } = await this.userClient.call('getUserForAuth', { email });

    if (!user)
      throw new RpcException({
        code: RpcStatus.INVALID_ARGUMENT,
        details: 'Неверный email или пароль',
      });

    const { passwordHash } = user;

    const isPasswordMatch = await bcrypt.compare(password, passwordHash!);

    if (!isPasswordMatch)
      throw new RpcException({
        code: RpcStatus.INVALID_ARGUMENT,
        details: 'Неверный email или пароль',
      });

    const tokens = await this.passportService.generateTokens({
      userId: user.id,
      username: user.username,
      sub: user.id,
    });

    return tokens;
  }

  async registrationUser(
    dto: RegistrationRequest,
  ): Promise<RegistrationResponse> {
    const { user: exsistingUser } = await this.userClient.call('getUser', {
      username: dto.username,
      email: dto.email,
    });

    if (exsistingUser)
      throw new RpcException({
        code: RpcStatus.INVALID_ARGUMENT,
        details: 'Пользователь с таким email или username уже существует',
      });

    const { password } = dto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const { user } = await this.userClient.call('createUser', {
        username: dto.username,
        email: dto.email,
        passwordHash,
      });

      return { status: !!user };
    } catch {
      throw new RpcException({
        code: RpcStatus.INVALID_ARGUMENT,
        details: 'Ошибка при регистрации',
      });
    }
  }

  async verifyToken(dto: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    try {
      const payload = await this.passportService.verifyToken(
        dto.token,
        'access',
      );

      return {
        isValid: true,
        ...payload,
      };
    } catch {
      throw new RpcException({
        code: RpcStatus.UNAUTHENTICATED,
        details: 'Невалидный токен',
      });
    }
  }

  async refreshTokens(dto: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = dto;

    const tokens = await this.passportService.refreshTokens(refreshToken);

    return tokens;
  }
}
