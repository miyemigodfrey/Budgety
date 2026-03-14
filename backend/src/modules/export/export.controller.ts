import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@ApiTags('Export')
@ApiBearerAuth('JWT-auth')
@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('pdf')
  @ApiOperation({ summary: 'Export transactions report as PDF' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date (ISO string)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date (ISO string)',
    example: '2026-03-14',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file download',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing startDate or endDate' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No sources found' })
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

  @Get('summary')
  @ApiOperation({ summary: 'Get report page summary and chart data' })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to include in chart data (default: 6)',
    example: 6,
  })
  @ApiResponse({ status: 200, description: 'Report summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(
    @CurrentUser() user: { id: string },
    @Query('months') months?: number,
  ) {
    return this.exportService.getSummary(user.id, months ?? 6);
  }

  @Get('csv')
  @ApiOperation({ summary: 'Export transactions report as CSV' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Start date (ISO string). Defaults to first day of current month',
    example: '2026-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO string). Defaults to today',
    example: '2026-03-14',
  })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
    content: {
      'text/csv': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  exportCsv(
    @CurrentUser() user: { id: string },
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Res() res: Response,
  ) {
    const { csv, range } = this.exportService.exportCsv(
      user.id,
      startDate,
      endDate,
    );

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="budgety-report-${range.startDate}-to-${range.endDate}.csv"`,
    });

    res.send(csv);
  }
}
