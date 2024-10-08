import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Accounts } from './entities/account.entity';
import { User } from 'src/user/entities/user.entity';
import { Transactions } from 'src/transaction/entities/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transactions)
    private transactionRepository: Repository<Transactions>,
  ) {}

  private async findUserById(userId: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async findAccountById(id: string, userId: any): Promise<Accounts> {
    const account = await this.accountRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!account) {
      throw new NotFoundException(
        `Account with ID ${id} not found or not accessible by this user`,
      );
    }
    return account;
  }

  async create(
    createAccountDto: CreateAccountDto,
    userId: string,
  ): Promise<any> {
    const user = await this.findUserById(userId);
    const newAccount = this.accountRepository.create(createAccountDto);
    newAccount.user = user;

    const res = await this.accountRepository.save(newAccount);
    const new_transactions = Object.entries(createAccountDto?.balance)?.map(
      ([key, value]: [string, number]) => ({
        account_id: res?.id,
        amount: value,
        transaction_type: 'income',
        date: new Date().toISOString().split('T')[0],
        description: '',
        tags: ['Initial deposit'],
        related_source: null,
        related_currency: key,
        hide: false,
        user: user,
      }),
    );
    const newTransaction = await this.transactionRepository.create(new_transactions);
    console.log(newTransaction)
    await this.transactionRepository.save(newTransaction);

    return { message: 'Account created successfully', statusCode: 200, data:res };
  }

  async findAll(): Promise<Accounts[]> {
    return await this.accountRepository.find();
  }

  async listAccounts(
    userId: any, 
    skip: number = 0, 
    limit: number = 10
  ): Promise<{ data: Accounts[]; statusCode: number; message: string; total: number }> {
    
    const [accounts, total] = await this.accountRepository.findAndCount({
      where: { user: { id: userId } },
      skip: skip,
      take: limit,
    });
  
    if (accounts.length === 0) {
      throw new NotFoundException(`No accounts found for User ID ${userId}`);
    }
  
    return {
      data: accounts,
      statusCode: 200,
      message: 'Refreshed.',
      total: total, // total number of accounts for the user
    };
  }
  async findOne(id: string, userId: string): Promise<Accounts> {
    return await this.findAccountById(id, userId);
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    userId: string,
  ): Promise<{ statusCode: number; message: string }> {
    const account = await this.findAccountById(id, userId);
    Object.assign(account, updateAccountDto);
    await this.accountRepository.save(account);
    return { statusCode: 200, message: 'Account updated successfully.' };
  }

  async remove(id: string, userId: string): Promise<string> {
    const account = await this.findAccountById(id, userId);
    await this.accountRepository.remove(account);
    return 'Account removed successfully';
  }
}
