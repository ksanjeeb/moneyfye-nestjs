import { IsString, IsArray, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    description: 'The group the account belongs to',
    example: 'Savings',
  })
  @IsString()
  @IsNotEmpty()
  group: string;

  @ApiProperty({
    description: 'The name of the account',
    example: 'Personal Savings Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The balance of the account, with currency codes as keys',
    example: { USD: 1000, EUR: 500 },
    type: 'object',
  })
  @IsObject()
  @IsNotEmpty()
  balance: { [currencyCode: string]: number };

  @ApiProperty({
    description: 'List of currencies associated with the account',
    example: ['USD', 'EUR'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  currencies: string[];
}
