import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Accounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  group: string;

  @Column()
  name: string;

  @Column('json')
  balance: { [currencyCode: string]: number }; 

  @Column('simple-array')
  currencies: string[];
}