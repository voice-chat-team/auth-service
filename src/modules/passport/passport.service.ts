import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import type { TokenPayloadDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { RpcStatus } from '@voice-chat/common';

@Injectable()
export class PassportService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: TokenPayloadDto) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES',
      ) as JwtSignOptions['expiresIn'],
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES',
      ) as JwtSignOptions['expiresIn'],
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyToken(
    token: string,
    tokenType: 'access' | 'refresh',
  ): Promise<TokenPayloadDto> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow<string>(
        `JWT_${tokenType.toUpperCase()}_SECRET`,
      ),
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.verifyToken(refreshToken, 'refresh');

      const tokens = await this.generateTokens({
        userId: payload.userId,
        username: payload.username,
        sub: payload.sub,
      });

      return tokens;
    } catch {
      throw new RpcException({
        code: RpcStatus.UNAUTHENTICATED,
        details: 'Невалидный Refresh-токен',
      });
    }
  }
}
