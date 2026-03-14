import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from '../../common/interfaces';
import {
  TransactionResponseDto,
  MessageResponseDto,
} from '../../common/dto/responses';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with optional filters' })
  @ApiQuery({
    name: 'sourceId',
    required: false,
    description: 'Filter by source UUID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['inflow', 'outflow', 'transfer'],
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions list',
    type: [TransactionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('sourceId') sourceId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.findAll(user.id, {
      sourceId,
      type: type as TransactionType,
      startDate,
      endDate,
    });
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get transactions page overview data' })
  @ApiResponse({
    status: 200,
    description: 'Transaction totals, monthly summary and recent transactions',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getOverview(@CurrentUser() user: { id: string }) {
    return this.transactionsService.getOverview(user.id);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get monthly transaction trend data' })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to include (default: 6)',
    example: 6,
  })
  @ApiResponse({ status: 200, description: 'Monthly trend data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTrends(
    @CurrentUser() user: { id: string },
    @Query('months') months?: number,
  ) {
    return this.transactionsService.getTrends(user.id, months ?? 6);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or insufficient balance',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or insufficient balance',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction or source not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete: would cause negative balance',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  delete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    this.transactionsService.delete(id, user.id);
    return { message: 'Transaction deleted' };
  }
}
