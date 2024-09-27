import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Accounts } from './entities/account.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    await this.accountRepository.save(newAccount);
    return {message:'Account created successfully', statusCode:200};
  }

  async findAll(): Promise<Accounts[]> {
    return await this.accountRepository.find();
  }

  async listAccounts(userId: any): Promise<{ data: Accounts[]; statusCode: number , message:string}> {
    const accounts = await this.accountRepository.find({
      where: { user: { id: userId } },
    });

    if (!accounts || accounts.length === 0) {
      throw new NotFoundException(`No accounts found for User ID ${userId}`);
    }

    return { data: accounts, statusCode: 200 , message:"Accounts fetched." };
  }


  async findOne(id: string, userId: string): Promise<Accounts> {
    return await this.findAccountById(id, userId);
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    userId: string,
  ): Promise<string> {
    const account = await this.findAccountById(id, userId);
    Object.assign(account, updateAccountDto);
    await this.accountRepository.save(account);
    return 'Account updated successfully';
  }

  async remove(id: string, userId: string): Promise<string> {
    const account = await this.findAccountById(id, userId);
    await this.accountRepository.remove(account);
    return 'Account removed successfully';
  }


}
