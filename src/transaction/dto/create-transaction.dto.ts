import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @IsOptional()
  @IsString()
  account_from?: string;

  @IsOptional()
  @IsString()
  account_to?: string;

  @IsUUID()
  transaction_id: string;

  @IsNumber()
  amount: number;

  @IsEnum(['income', 'expense', 'transfer_in', 'other'])
  transaction_type: 'income' | 'expense' | 'transfer_in' | string;

  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  related_source?: string | null;

  @IsString()
  related_currency: string;

  @IsOptional()
  @IsBoolean()
  hide?: boolean;
}
