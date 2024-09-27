import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';
import { User } from 'src/user/entities/user.entity';
import { Accounts } from 'src/accounts/entities/account.entity';
import { AccountsService } from 'src/accounts/accounts.service';
import { AccountsModule } from 'src/accounts/accounts.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Transactions, User, Accounts]), AccountsModule],
  controllers: [TransactionController],
  providers: [TransactionService, AccountsService], 
})
export class TransactionModule {}
