import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Accounts } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Accounts)
    private readonly accountRepository: Repository<Accounts>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Accounts> {
    const newAccount = this.accountRepository.create(createAccountDto);
    return await this.accountRepository.save(newAccount); 
  }

  async findAll(): Promise<Accounts[]> {
    return await this.accountRepository.find();
  }

  async findOne(id: string): Promise<Accounts> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Accounts with ID ${id} not found`);
    }
    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Accounts> {
    const account = await this.findOne(id); 
    Object.assign(account, updateAccountDto); 
    return await this.accountRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    await this.accountRepository.remove(account); 
  }
}
