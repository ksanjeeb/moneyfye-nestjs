import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: "234567890fgeguidsfogfsidkg4343jfjhdsgfjdgud89534rwepowfk",
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}