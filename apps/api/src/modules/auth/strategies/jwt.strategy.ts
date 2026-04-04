import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'changeme',
    });
  }

  async validate(payload: { sub: string; role?: string }) {
    // 1. Check if this is a service-to-service token (e.g. from ws-server)
    if (payload.role === 'service' && payload.sub === 'ws-server') {
      return {
        id: 'ws-server',
        firstName: 'System',
        lastName: 'Service',
        userName: 'ws-server',
        role: 'service',
      };
    }

    // 2. Otherwise, treat as a normal user token
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
