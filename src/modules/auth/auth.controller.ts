import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GrpcMethod } from '@nestjs/microservices';
import type { LoginRequest } from '@voice-chat/contracts/gen/auth';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Login')
  login(dto: LoginRequest) {
    return this.authService.loginUser(dto);
  }
}
