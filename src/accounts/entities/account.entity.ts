import { User } from 'src/user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('accounts')
export class Accounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column()
  group: string;

  @Column()
  name: string;

  @Column('json')
  balance: { [currencyCode: string]: number };

  @Column('simple-array')
  currencies: string[];

  @ManyToOne(() => User, (user) => user.accounts ,{eager:false})
  user: User;
}
