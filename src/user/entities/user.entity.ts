import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Accounts } from 'src/accounts/entities/account.entity';
import { Transactions } from 'src/transaction/entities/transaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id?: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @OneToMany(() => Accounts, (accounts) => accounts.user)
  accounts: Accounts[];

  @OneToMany(() => Transactions, (transaction) => transaction.user)
  transactions: Transactions[];
}
