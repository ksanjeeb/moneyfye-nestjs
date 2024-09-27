import { IsNotEmpty, IsString, IsNumber, IsArray, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionPayloadDto {
  @ApiProperty({ description: 'The ID of the account associated with the transaction' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'The currency code of the transaction' })
  @IsNotEmpty()
  @IsString()
  currency_code: string;

  @ApiProperty({ description: 'The amount of the transaction', example: 100.0 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Description of the transaction', example: 'Groceries' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Tags associated with the transaction', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'The date of the transaction', example: '2024-09-27' })
  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export class TransferPayloadDto {
  @ApiProperty({ description: 'The ID of the account from which money is transferred' })
  @IsNotEmpty()
  @IsString()
  from_account_id: string;

  @ApiProperty({ description: 'The currency code from which money is transferred' })
  @IsNotEmpty()
  @IsString()
  from_currency_code: string;

  @ApiProperty({ description: 'The ID of the account to which money is transferred' })
  @IsNotEmpty()
  @IsString()
  to_account_id: string;

  @ApiProperty({ description: 'The amount of money to transfer', example: 50.0 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Description of the transfer', example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tags associated with the transfer', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'The date of the transfer', example: '2024-09-27' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
