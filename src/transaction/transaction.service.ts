import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async findUserById(userId: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async findTransactionById(id: string, userId: any): Promise<Transactions> {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_id: id, user: { id: userId } },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${id} not found or not accessible by this user`,
      );
    }
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto, userId: any): Promise<string> {
    const user = await this.findUserById(userId);
    const newTransaction = this.transactionRepository.create(createTransactionDto);
    newTransaction.user = user;
    await this.transactionRepository.save(newTransaction);
    return 'Transaction created successfully';
  }

  async findAll(): Promise<Transactions[]> {
    return await this.transactionRepository.find();
  }

  async listTransactions(userId: any): Promise<Transactions[]> {
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId } },
    });

    if (transactions.length === 0) {
      throw new NotFoundException(`No transactions found for User ID ${userId}`);
    }

    return transactions;
  }

  async findOne(id: string, userId: string): Promise<Transactions> {
    return await this.findTransactionById(id, userId);
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ): Promise<string> {
    const transaction = await this.findTransactionById(id, userId);
    this.transactionRepository.merge(transaction, updateTransactionDto);
    await this.transactionRepository.save(transaction);
    return 'Transaction updated successfully';
  }

  async remove(id: string, userId: string): Promise<string> {
    const transaction = await this.findTransactionById(id, userId);
    await this.transactionRepository.remove(transaction);
    return 'Transaction removed successfully';
  }
}