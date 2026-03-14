import { Injectable } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class SettingsService {
  constructor(private readonly storage: StorageService) {}

  getSettings(userId: string) {
    return this.storage.getUserSettings(userId);
  }

  updateSettings(
    userId: string,
    updates: {
      dailyReminder?: boolean;
      appLockEnabled?: boolean;
      darkMode?: boolean;
      backupEnabled?: boolean;
    },
  ) {
    return this.storage.updateUserSettings(userId, updates);
  }
}
