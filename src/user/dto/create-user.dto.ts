import {
  IsAlphanumeric,
  IsNotEmpty,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const passwordRegEx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

export class CreateUserDto {
  @ApiProperty({
    example: 'admin12',
  })
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must have at least 3 characters.' })
  @IsAlphanumeric(null, {
    message: 'Username can only contain alphanumeric characters.',
  })
  username: string;

  @ApiProperty({
    example: 'admin@123',
  })
  @IsNotEmpty()
  @Matches(passwordRegEx, {
    message: `Password must contain a minimum of 8 and a maximum of 20 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.`,
  })
  password: string;
}
