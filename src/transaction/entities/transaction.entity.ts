import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('transactions') 
export class Transactions {
  @PrimaryGeneratedColumn('uuid')
  transaction_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_from?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_to?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['income', 'expense', 'transfer_in', 'other'], default: 'other' })
  transaction_type: 'income' | 'expense' | 'transfer_in' | string;

  @Column({ type: 'timestamp' })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column('simple-array') 
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  related_source: string | null;

  @Column({ type: 'varchar', length: 255 })
  related_currency: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  hide?: boolean;
}
