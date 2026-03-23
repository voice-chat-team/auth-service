import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type RegistrationRequest,
  type RegistrationResponse,
  type LoginRequest,
  type LoginResponse,
} from '@voice-chat/contracts/gen/auth';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Login')
  async login(dto: LoginRequest): Promise<LoginResponse> {
    return await this.authService.loginUser(dto);
  }

  @GrpcMethod('AuthService', 'Registration')
  async registration(dto: RegistrationRequest): Promise<RegistrationResponse> {
    return await this.authService.registrationUser(dto);
  }
}
