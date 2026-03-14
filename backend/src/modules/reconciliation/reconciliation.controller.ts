import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReconciliationService } from './reconciliation.service';
import { ReconcileDto } from './dto/reconcile.dto';
import {
  ReconcileResultDto,
  DiscrepancyResponseDto,
} from '../../common/dto/responses';

@ApiTags('Reconciliation')
@ApiBearerAuth('JWT-auth')
@Controller('reconcile')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit actual balances for reconciliation' })
  @ApiResponse({
    status: 201,
    description: 'Reconciliation results',
    type: [ReconcileResultDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  reconcile(@Body() dto: ReconcileDto, @CurrentUser() user: { id: string }) {
    return this.reconciliationService.reconcile(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current balance discrepancies' })
  @ApiResponse({
    status: 200,
    description: 'Discrepancy list',
    type: [DiscrepancyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDiscrepancies(@CurrentUser() user: { id: string }) {
    return this.reconciliationService.getDiscrepancies(user.id);
  }

  @Get('source/:sourceId')
  @ApiOperation({ summary: 'Get reconciliation summary for a specific source' })
  @ApiResponse({
    status: 200,
    description: 'Source balances and latest reconciliation snapshot',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  getSourceSummary(
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.reconciliationService.getSourceSummary(sourceId, user.id);
  }
}
