import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  account_from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  account_to?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['income', 'expense', 'transfer_in', 'other'] })
  @IsEnum(['income', 'expense', 'transfer_in', 'other'])
  transaction_type: 'income' | 'expense' | 'transfer_in' | string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  related_source?: string | null;

  @ApiProperty()
  @IsString()
  related_currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hide?: boolean;
}
