import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import {
  SourceResponseDto,
  SourceDetailResponseDto,
  MessageResponseDto,
} from '../../common/dto/responses';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sources')
@ApiBearerAuth('JWT-auth')
@Controller('sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sources' })
  @ApiResponse({
    status: 200,
    description: 'Sources list',
    type: [SourceResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.sourcesService.findAll(user.id);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get sources page overview data' })
  @ApiResponse({
    status: 200,
    description: 'Source cards and totals',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOverview(@CurrentUser() user: { id: string }) {
    return this.sourcesService.findOverview(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get source by ID with transaction history' })
  @ApiParam({ name: 'id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Source details with transactions',
    type: SourceDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sourcesService.findOne(id, user.id);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get source detail page overview data' })
  @ApiParam({ name: 'id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Source detail summary, monthly stats and recent transactions',
  })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOverviewById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.sourcesService.findOverviewById(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new source' })
  @ApiResponse({
    status: 201,
    description: 'Source created',
    type: SourceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateSourceDto, @CurrentUser() user: { id: string }) {
    return this.sourcesService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a source' })
  @ApiParam({ name: 'id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Source updated',
    type: SourceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.sourcesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a source and its transactions' })
  @ApiParam({ name: 'id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Source deleted',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  delete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    this.sourcesService.delete(id, user.id);
    return { message: 'Source deleted' };
  }
}