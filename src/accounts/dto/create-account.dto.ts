import { IsString, IsArray, IsNotEmpty, IsObject } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  balance: { [currencyCode: string]: number };

  @IsArray()
  @IsString({ each: true })
  currencies: string[];
}
