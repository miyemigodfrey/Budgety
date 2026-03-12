import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './common/services/storage.service';
import { AuthModule } from './modules/auth/auth.module';
import { SourcesModule } from './modules/sources/sources.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { ExportModule } from './modules/export/export.module';

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
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class AppModule {}
