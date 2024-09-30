import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  TransactionPayloadDto,
  TransferPayloadDto,
} from './dto/payload-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth('defaultBearerAuth')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() req: any,
  ) {
    return this.transactionService.create(createTransactionDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.transactionService.findAll();
  }

  @Get('list')
  listTransactions(
    @Request() req: any,
    @Query('skip') skip: string = '0',
    @Query('limit') limit: string = '100',
  ) {
    return this.transactionService.listTransactions(
      req.user.id,
      parseInt(skip),
      parseInt(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.transactionService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req: any,
  ) {
    return this.transactionService.update(
      id,
      updateTransactionDto,
      req.user.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.transactionService.remove(id, req.user.id);
  }

  @Post('add-income')
  addIncome(
    @Body() transactionPayload: TransactionPayloadDto,
    @Request() req: any,
  ) {
    return this.transactionService.addIncome(transactionPayload, req.user.id);
  }

  @Post('add-expense')
  addExpense(
    @Body() transactionPayload: TransactionPayloadDto,
    @Request() req: any,
  ) {
    return this.transactionService.addExpense(transactionPayload, req.user.id);
  }

  @Post('transfer')
  transferMoney(
    @Body() transferPayload: TransferPayloadDto,
    @Request() req: any,
  ) {
    return this.transactionService.transferMoney(transferPayload, req.user.id);
  }

  @Patch(':id/edit')
  async editTransaction(
    @Param('id') id: string,
    @Body() transactionPayload: TransactionPayloadDto,
    @Request() req: any,
  ) {
    return this.transactionService.editTransaction(
      transactionPayload,
      req.user.id,
      id,
    );
  }
}
