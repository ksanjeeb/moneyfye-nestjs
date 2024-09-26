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
  @Column({ type: 'varchar' , select:false})
  password: string;

  @OneToMany(() => Accounts, (accounts) => accounts.user, {cascade:true, eager: true })
  accounts: Accounts[];

  @OneToMany(() => Transactions, (transaction) => transaction.user, { cascade:true, eager: true })
  transactions: Transactions[];
}
