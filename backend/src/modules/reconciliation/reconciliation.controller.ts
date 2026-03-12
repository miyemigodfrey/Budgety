import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReconciliationService } from './reconciliation.service';
import { ReconcileDto } from './dto/reconcile.dto';

@Controller('reconcile')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  reconcile(@Body() dto: ReconcileDto, @CurrentUser() user: { id: string }) {
    return this.reconciliationService.reconcile(dto, user.id);
  }

  @Get()
  getDiscrepancies(@CurrentUser() user: { id: string }) {
    return this.reconciliationService.getDiscrepancies(user.id);
  }
}
