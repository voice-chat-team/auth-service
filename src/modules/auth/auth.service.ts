/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { LoginUserDto } from '@voice-chat/contracts';
import { UserClient } from '../user/user.client';
import { RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private readonly userClient: UserClient) {}

  async loginUser(dto: LoginUserDto) {
    const { email } = dto;

    const exsistUser = await firstValueFrom(
      this.userClient.getUserByEmail(email),
    );

    if (!exsistUser) throw new RpcException('Пользователь не найден');

    return exsistUser;
  }
}
