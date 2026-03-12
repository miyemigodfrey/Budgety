import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('pdf')
  async exportPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'startDate and endDate query params are required',
      );
    }

    const buffer = await this.exportService.exportPdf(
      user.id,
      startDate,
      endDate,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="budgety-report-${startDate}-to-${endDate}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
