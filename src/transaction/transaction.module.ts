import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transactions])],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
