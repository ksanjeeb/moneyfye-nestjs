import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accounts } from './entities/account.entity';
import { User } from 'src/user/entities/user.entity';
import { Transactions } from 'src/transaction/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accounts, User, Transactions])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],

})
export class AccountsModule {}
