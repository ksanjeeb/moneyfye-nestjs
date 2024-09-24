import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  group: string;

  @Column()
  name: string;

  @Column('jsonb')
  balance: { [currencyCode: string]: number }; 

  @Column('simple-array')
  currencies: string[];
}