import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './common/services/storage.service';
import { SeedService } from './common/services/seed.service';
import { AuthModule } from './modules/auth/auth.module';
import { SourcesModule } from './modules/sources/sources.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { ExportModule } from './modules/export/export.module';
import { SettingsModule } from './modules/settings/settings.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SourcesModule,
    TransactionsModule,
    CategoriesModule,
    DashboardModule,
    ReconciliationModule,
    ExportModule,
    SettingsModule,
  ],
  providers: [StorageService, SeedService],
  exports: [StorageService],
})
export class AppModule {}
