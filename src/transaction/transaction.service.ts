import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactions } from './entities/transaction.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import {
  TransactionPayloadDto,
  TransferPayloadDto,
} from 'src/transaction/dto/payload-transaction.dto';
import { AccountsService } from 'src/accounts/accounts.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Parser } from '@json2csv/plainjs';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transactions)
    private transactionRepository: Repository<Transactions>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private accountService: AccountsService,
  ) {}

  private async findUserById(userId: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async findTransactionById(
    id: string,
    userId: any,
  ): Promise<Transactions> {
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

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: any,
  ): Promise<string> {
    const user = await this.findUserById(userId);
    const newTransaction =
      this.transactionRepository.create(createTransactionDto);
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
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    transactionType?: string,
  ): Promise<{
    data: Transactions[];
    statusCode: number;
    message: string;
    total: number;
  }> {
    const queryConditions: any = { user: { id: userId } };
    if (transactionType && transactionType !== 'all')
      queryConditions.transaction_type = transactionType;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      queryConditions.date = Between(start, end);
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      queryConditions.date = MoreThanOrEqual(start);
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryConditions.date = LessThanOrEqual(end);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: queryConditions,
        skip: skip,
        take: limit,
        order: {
          created_at: 'DESC',
        },
      },
    );

    if (transactions.length === 0) {
      return {
        data: [],
        statusCode: 200,
        message: 'No transaction found.',
        total: 0,
      };
    }

    return {
      data: transactions,
      statusCode: 200,
      message: 'Refreshed.',
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
      throw new NotFoundException(
        `Currency ${currency_code} not found in the account balance`,
      );
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

    return { statusCode: 200, message: 'Success!', data: response };
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
      throw new NotFoundException(
        `Currency ${currency_code} not found in the account balance`,
      );
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

    return { statusCode: 200, message: 'Success!', data: response };
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

    const fromAccount = await this.accountService.findOne(
      from_account_id,
      userId,
    );
    const toAccount = await this.accountService.findOne(to_account_id, userId);
    const user = await this.findUserById(userId);

    if (!fromAccount) {
      throw new NotFoundException(
        `From account ID ${from_account_id} not found for User ID ${userId}`,
      );
    }
    if (!toAccount) {
      throw new NotFoundException(
        `To account ID ${to_account_id} not found for User ID ${userId}`,
      );
    }

    const fromCurrencyBalance = fromAccount.balance[from_currency_code];
    if (fromCurrencyBalance === undefined) {
      throw new NotFoundException(
        `Currency ${from_currency_code} not found in the from account balance`,
      );
    }
    if (fromCurrencyBalance < amount) {
      throw new BadRequestException(
        `Insufficient balance in ${from_currency_code} to transfer ${amount}`,
      );
    }

    fromAccount.balance[from_currency_code] -= amount;

    await this.accountService.update(
      from_account_id,
      { balance: fromAccount.balance },
      userId,
    );

    if (toAccount.balance[from_currency_code] !== undefined) {
      toAccount.balance[from_currency_code] += amount;
    } else {
      toAccount.balance[from_currency_code] = amount;
    }

    await this.accountService.update(
      to_account_id,
      { balance: toAccount.balance },
      userId,
    );

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

    return { statusCode: 200, message: 'Transfered!', data: response };
  }

  async editTransaction(
    payload: TransactionPayloadDto,
    userId: string,
    transactionId: string,
  ) {
    const { currency_code, amount, description, tags, date } = payload;

    const existingTransaction = await this.transactionRepository.findOne({
      where: { transaction_id: transactionId },
    });
    if (!existingTransaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    const account = await this.accountService.findOne(
      existingTransaction.account_id,
      userId,
    );
    if (!account) {
      throw new NotFoundException(`Account not found for User ID ${userId}`);
    }

    const fromAccount = await this.accountService.findOne(
      existingTransaction.account_from,
      userId,
    );
    const toAccount = await this.accountService.findOne(
      existingTransaction.account_to,
      userId,
    );

    const revertOldBalances = () => {
      if (existingTransaction.transaction_type === 'income') {
        account.balance[currency_code] -= existingTransaction.amount;
      } else if (existingTransaction.transaction_type === 'expense') {
        account.balance[currency_code] += Math.abs(existingTransaction.amount);
      } else if (existingTransaction.transaction_type === 'transfer_in') {
        if (fromAccount) {
          fromAccount.balance[currency_code] += existingTransaction.amount;
        }
        if (toAccount) {
          toAccount.balance[currency_code] -= existingTransaction.amount;
        }
      }
    };

    revertOldBalances();

    existingTransaction.amount =
      existingTransaction.transaction_type === 'expense' ? -amount : amount;
    existingTransaction.date = new Date(date).toISOString().split('T')[0];
    existingTransaction.description = description;
    existingTransaction.tags = tags;
    existingTransaction.related_currency = currency_code;

    if (existingTransaction.transaction_type === 'income') {
      account.balance[currency_code] += amount;
    } else if (existingTransaction.transaction_type === 'expense') {
      account.balance[currency_code] -= Math.abs(amount);
    } else if (existingTransaction.transaction_type === 'transfer_in') {
      if (fromAccount) {
        fromAccount.balance[currency_code] -= amount;
      }
      if (toAccount) {
        toAccount.balance[currency_code] += amount;
      }
    }

    const response = await this.transactionRepository.save(existingTransaction);
    await this.accountService.update(
      account.id,
      { balance: account.balance },
      userId,
    );
    if (fromAccount)
      await this.accountService.update(
        fromAccount.id,
        { balance: fromAccount.balance },
        userId,
      );
    if (toAccount)
      await this.accountService.update(
        toAccount.id,
        { balance: toAccount.balance },
        userId,
      );

    return { statusCode: 200, message: 'Updated!', data: response };
  }

  async listReports(
    userId: any,
    year: number,
  ): Promise<{
    data: any[];
    statusCode: number;
    message: string;
  }> {
    const startOfYear: any = new Date(year, 0, 1, 0, 0, 0, 0);
    const endOfYear: any = new Date(year, 11, 31, 23, 59, 59, 999);

    const transactions = await this.transactionRepository.find({
      where: {
        user: { id: userId },
        date: Between(startOfYear, endOfYear),
      },
    });

    if (transactions.length === 0) {
      return {
        data: [],
        statusCode: 200,
        message: 'No transactions found for the selected year.',
      };
    }

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currencies = new Set<string>();
    const monthlyData = months.map((month) => ({ month }));

    transactions.forEach((transaction) => {
      currencies.add(transaction.related_currency);
    });

    currencies.forEach((currency) => {
      monthlyData.forEach((data) => {
        data[`income_${currency}`] = 0;
        data[`expenses_${currency}`] = 0;
        data[`netWorth_${currency}`] = 0;
      });
    });

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthIndex = transactionDate.getMonth();
      const amount =
        typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount;
      const currency = transaction.related_currency;

      if (transaction.transaction_type === 'expense') {
        monthlyData[monthIndex][`expenses_${currency}`] -= Math.abs(amount);
      } else if (transaction.transaction_type === 'income') {
        monthlyData[monthIndex][`income_${currency}`] += amount;
      }
    });

    monthlyData.forEach((data) => {
      currencies.forEach((currency) => {
        const income = data[`income_${currency}`] || 0;
        const expenses = data[`expenses_${currency}`] || 0;
        data[`netWorth_${currency}`] = income - Math.abs(expenses);
      });
    });

    return {
      data: monthlyData,
      statusCode: 200,
      message: 'Report generated successfully.',
    };
  }

  async generateXlxs(userId: any, res: any, type = 'xlsx') {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['accounts', 'transactions'],
    });

    const accountMap = new Map(
      user.accounts.map((account) => [account.id, account.name]),
    );

    if (type === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const accountsSheet = workbook.addWorksheet('Accounts');
      const transactionsSheet = workbook.addWorksheet('Transactions');

      accountsSheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Group', key: 'group', width: 20 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Balance', key: 'balance', width: 40 },
        { header: 'Currencies', key: 'currencies', width: 30 },
      ];

      user.accounts.forEach((account) => {
        accountsSheet.addRow({
          id: account.id,
          group: account.group,
          name: account.name,
          balance: Object.entries(account.balance)
            .map(([currency, amount]) => `${amount} ${currency}`)
            .join(', '),
          currencies: account.currencies.join(', '),
        });
      });

      transactionsSheet.columns = [
        { header: 'Transaction ID', key: 'transaction_id', width: 36 },
        { header: 'Account ID', key: 'account_id', width: 36 },
        { header: 'Account Name', key: 'account_name', width: 30 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Transaction Type', key: 'transaction_type', width: 20 },
        { header: 'Date', key: 'date', width: 30 },
        { header: 'Tags', key: 'tags', width: 30 },
        { header: 'Related Currency', key: 'related_currency', width: 20 },
      ];

      user.transactions.forEach((transaction) => {
        transactionsSheet.addRow({
          transaction_id: transaction.transaction_id,
          account_id: transaction.account_id,
          account_name:
            accountMap.get(transaction.account_id) ||
            'AC-' + transaction.account_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          date: transaction.date,
          tags: transaction.tags.join(', '),
          related_currency: transaction.related_currency,
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

      await workbook.xlsx.write(res);
      return res.end();
    } else if (type === 'csv') {
      const accounts = user.accounts.map((account) => {
        const dynamicBalances = {};

        account.currencies.forEach((currency) => {
          dynamicBalances[currency] = account?.balance?.[currency] || 0;
        });

        return {
          id: account.id,
          group: account.group,
          name: account.name,
          balance: account.balance,
          ...dynamicBalances,
          currencies: account.currencies.join(', '),
        };
      });

      const transactions = user.transactions.map((transaction) => ({
        transaction_id: transaction.transaction_id,
        account_id: transaction.account_id,
        account_name:
          accountMap.get(transaction.account_id) ||
          'AC-' + transaction.account_id,
        amount: transaction.amount,
        transaction_type: transaction.transaction_type,
        date: transaction.date,
        tags: transaction.tags.join(', '),
        related_currency: transaction.related_currency,
      }));

      const parserAc = new Parser({});
      const parserTrans = new Parser({});
      const accountsCsv = parserAc.parse(accounts);
      const transactionsCsv = parserTrans.parse(transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');

      const combinedCsv = `Accounts:\n${accountsCsv}\n\nTransactions:\n${transactionsCsv}`;
      return res.send(combinedCsv);
    } else {
      return res
        .status(400)
        .send({
          error: 'Unsupported file type. Please choose "xlsx" or "csv".',
        });
    }
  }
}
