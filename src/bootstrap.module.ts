import { Module } from '@nestjs/common';
import { C8yClientProviderService } from './service/c8y-client-provider.service';

@Module({
  providers: [C8yClientProviderService],
  exports: [C8yClientProviderService],
})
export class BootstrapModule {}
