import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StorageService } from '../../common/services/storage.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '../../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly storage: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = this.storage.findUserByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user: IUser = {
      id: crypto.randomUUID(),
      email: dto.email,
      name: dto.name,
      password: hashed,
      createdAt: new Date(),
    };

    this.storage.createUser(user);
    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = this.storage.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: IUser) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
