import { Injectable } from '@nestjs/common';
import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
} from '@voice-chat/contracts/gen/auth';
import { RpcException } from '@nestjs/microservices';
import { combineLatest, firstValueFrom } from 'rxjs';
import { UserClientGrpc } from '../user/user.grpc';

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly userClientGrpc: UserClientGrpc) {}

  async loginUser(dto: LoginRequest): Promise<LoginResponse> {
    const { email, password } = dto;

    const { user } = await firstValueFrom(
      this.userClientGrpc.getUserByEmail({ email }),
    );

    if (!user)
      throw new RpcException({
        code: 3,
        details: 'Неверный email или пароль',
      });

    const { passwordHash } = user;
    const isPasswordMatch = await bcrypt.compare(password, passwordHash);

    if (!isPasswordMatch)
      throw new RpcException({
        code: 3,
        details: 'Неверный email или пароль',
      });

    return {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };
  }

  async registrationUser(
    dto: RegistrationRequest,
  ): Promise<RegistrationResponse> {
    const [userByEmail, userByUsername] = await firstValueFrom(
      combineLatest([
        this.userClientGrpc.getUserByEmail({ email: dto.email }),
        this.userClientGrpc.getUserByUsername({ username: dto.username }),
      ]),
    );

    if (userByEmail.user || userByUsername.user)
      throw new RpcException({
        code: 3,
        details: 'Пользователь с таким email или username уже существует',
      });

    const { password } = dto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const { user } = await firstValueFrom(
        this.userClientGrpc.createUser({
          username: dto.username,
          email: dto.email,
          passwordHash,
        }),
      );

      return { status: !!user };
    } catch {
      throw new RpcException({
        code: 3,
        details: 'Ошибка при регистрации',
      });
    }
  }
}
