import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Current user settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSettings(@CurrentUser() user: { id: string }) {
    return this.settingsService.getSettings(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Updated user settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateSettings(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.id, dto);
  }
}
