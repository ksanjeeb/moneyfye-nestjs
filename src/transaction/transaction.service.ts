import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transactions)
    private transactionRepository: Repository<Transactions>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: any,
  ): Promise<Transactions> {
    const newTransaction = this.transactionRepository.create(createTransactionDto);
    return await this.transactionRepository.save(newTransaction);
  }

  async findAll(): Promise<Transactions[]> {
    return await this.transactionRepository.find();
  }

  async findOne(id: string): Promise<Transactions> {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_id: String(id) },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transactions> {
    const transaction = await this.findOne(id);
    const updatedTransaction = this.transactionRepository.merge(
      transaction,
      updateTransactionDto,
    );
    return await this.transactionRepository.save(updatedTransaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.remove(transaction);
  }
}
