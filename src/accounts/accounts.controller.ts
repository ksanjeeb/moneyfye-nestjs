import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Accounts } from './entities/account.entity';

@ApiTags('accounts')
@ApiBearerAuth('defaultBearerAuth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto, @Request() req: any) {
    return this.accountsService.create(createAccountDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get('list')
  async listAccounts(
    @Request() req: any,
    @Query('skip') skip: string = '0', 
    @Query('limit') limit: string = '10',
  ): Promise<{ data: Accounts[]; statusCode: number; message: string; total: number }> {
    
    const userId = req.user.id;

    const parsedSkip = parseInt(skip, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedSkip) || isNaN(parsedLimit)) {
      throw new BadRequestException('Invalid skip or limit values. They must be numbers.');
    }

    return await this.accountsService.listAccounts(userId, parsedSkip, parsedLimit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.accountsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @Request() req: any) {
    return this.accountsService.update(id, updateAccountDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.accountsService.remove(id, req.user.id);
  }
}