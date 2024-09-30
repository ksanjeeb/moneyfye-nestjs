import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { TransactionPayloadDto, TransferPayloadDto } from 'src/transaction/dto/payload-transaction.dto';
import { AccountsService } from 'src/accounts/accounts.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transactions)
    private transactionRepository: Repository<Transactions>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private accountService:AccountsService,
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

  async listTransactions(
    userId: any, 
    skip: number = 0, 
    limit: number = 10
  ): Promise<{ data: Transactions[]; statusCode: number; message: string; total: number }> {
    
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { user: { id: userId } },
      skip: skip,
      take: limit,
    });
  
    if (transactions.length === 0) {
      throw new NotFoundException(`No transactions found for User ID ${userId}`);
    }
  
    return { 
      data: transactions, 
      statusCode: 200, 
      message: "Refreshed.", 
      total: total,  
    };
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


  async addIncome(payload: TransactionPayloadDto, userId: string) {
    const { currency_code, amount, description, tags, id, date } = payload;
    const account = await this.accountService.findOne(id, userId);
    const user = await this.findUserById(userId);
  
    if (!account) {
      throw new NotFoundException(`No accounts found for User ID ${userId}`);
    }
  
    const currencyBalance = account.balance[currency_code];
    if (currencyBalance === undefined) {
      throw new NotFoundException(`Currency ${currency_code} not found in the account balance`);
    }
  
    account.balance[currency_code] += amount;
    await this.accountService.update(id, { balance: account.balance }, userId);
  
    const newTransaction = this.transactionRepository.create({
      account_id: id,
      amount,
      transaction_type: 'income',
      date: new Date(date).toISOString().split('T')[0],
      description,
      tags,
      related_source: null,
      related_currency: currency_code,
      user, 
    });
  
    const response = await this.transactionRepository.save(newTransaction);

    return {statusCode:200, message:"Success!", data:response}
  }


  async addExpense(payload: TransactionPayloadDto, userId: string) {
    const { currency_code, amount, description, tags, id, date } = payload;
    const account = await this.accountService.findOne(id, userId);
    const user = await this.findUserById(userId);
  
    if (!account) {
      throw new NotFoundException(`No accounts found for User ID ${userId}`);
    }
  
    const currencyBalance = account.balance[currency_code];
    if (currencyBalance === undefined) {
      throw new NotFoundException(`Currency ${currency_code} not found in the account balance`);
    }
  
    account.balance[currency_code] -= amount;
    
    await this.accountService.update(id, { balance: account.balance }, userId);
  
    const newTransaction = this.transactionRepository.create({
      account_id: id,
      amount: -amount, 
      transaction_type: 'expense',
      date: new Date(date).toISOString().split('T')[0],
      description,
      tags,
      related_source: null,
      related_currency: currency_code,
      user,
    });
    const response = await this.transactionRepository.save(newTransaction);

    return {statusCode:200, message:"Success!", data:response}
  }
  

  async transferMoney(payload: TransferPayloadDto, userId: string) {
    const {
      from_account_id,
      from_currency_code,
      to_account_id,
      amount,
      description,
      tags,
      date,
    } = payload;
  
    const fromAccount = await this.accountService.findOne(from_account_id, userId);
    const toAccount = await this.accountService.findOne(to_account_id, userId);
    const user = await this.findUserById(userId);
  
    if (!fromAccount) {
      throw new NotFoundException(`From account ID ${from_account_id} not found for User ID ${userId}`);
    }
    if (!toAccount) {
      throw new NotFoundException(`To account ID ${to_account_id} not found for User ID ${userId}`);
    }
  
    const fromCurrencyBalance = fromAccount.balance[from_currency_code];
    if (fromCurrencyBalance === undefined) {
      throw new NotFoundException(`Currency ${from_currency_code} not found in the from account balance`);
    }
    if (fromCurrencyBalance < amount) {
      throw new BadRequestException(`Insufficient balance in ${from_currency_code} to transfer ${amount}`);
    }
  
    fromAccount.balance[from_currency_code] -= amount;
  
    await this.accountService.update(from_account_id, { balance: fromAccount.balance }, userId);
  
    if (toAccount.balance[from_currency_code] !== undefined) {
      toAccount.balance[from_currency_code] += amount;
    } else {
      toAccount.balance[from_currency_code] = amount;
    }
  
    await this.accountService.update(to_account_id, { balance: toAccount.balance }, userId);
  
    const newTransaction = this.transactionRepository.create({
      account_from: from_account_id,
      account_to: to_account_id,
      amount,
      transaction_type: 'transfer_in',
      date: new Date(date).toISOString().split('T')[0],
      description: description || `Transfer from ${from_account_id}`,
      tags,
      related_source: from_account_id,
      related_currency: from_currency_code,
      user,
    });
  
    const response = await this.transactionRepository.save(newTransaction);

    return {statusCode:200, message:"Transfered!", data:response}

  }


  async editTransaction(payload: TransactionPayloadDto, userId: string, transactionId: string) {
    const { currency_code, amount, description, tags, date } = payload;

    const existingTransaction = await this.transactionRepository.findOne({ where: { transaction_id: transactionId } });
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    const account = await this.accountService.findOne(existingTransaction.account_id, userId);
    if (!account) {
      throw new NotFoundException(`Account not found for User ID ${userId}`);
    }

    const fromAccount = await this.accountService.findOne(existingTransaction.account_from, userId);
    const toAccount = await this.accountService.findOne(existingTransaction.account_to, userId);

    const revertOldBalances = () => {
      if (existingTransaction.transaction_type === "income") {
        account.balance[currency_code] -= existingTransaction.amount;
      } else if (existingTransaction.transaction_type === "expense") {
        account.balance[currency_code] += Math.abs(existingTransaction.amount);
      } else if (existingTransaction.transaction_type === "transfer_in") {
        if (fromAccount) {
          fromAccount.balance[currency_code] += existingTransaction.amount;
        }
        if (toAccount) {
          toAccount.balance[currency_code] -= existingTransaction.amount;
        }
      }
    };

    revertOldBalances();

    existingTransaction.amount = existingTransaction.transaction_type === "expense" ? -amount : amount;
    existingTransaction.date = new Date(date).toISOString().split("T")[0];
    existingTransaction.description = description;
    existingTransaction.tags = tags;
    existingTransaction.related_currency = currency_code;

    if (existingTransaction.transaction_type === "income") {
      account.balance[currency_code] += amount;
    } else if (existingTransaction.transaction_type === "expense") {
      account.balance[currency_code] -= Math.abs(amount);
    } else if (existingTransaction.transaction_type === "transfer_in") {
      if (fromAccount) {
        fromAccount.balance[currency_code] -= amount;
      }
      if (toAccount) {
        toAccount.balance[currency_code] += amount;
      }
    }

    const response = await this.transactionRepository.save(existingTransaction);
    await this.accountService.update(account.id, { balance: account.balance }, userId);
    if (fromAccount) await this.accountService.update(fromAccount.id, { balance: fromAccount.balance }, userId);
    if (toAccount) await this.accountService.update(toAccount.id, { balance: toAccount.balance }, userId);

    return {statusCode:200, message:"Updated!", data:response}

  }
}