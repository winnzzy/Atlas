import { Module } from '@nestjs/common';
import { DemoController } from './controllers/demo.controller';
import { DemoRepository } from './repositories/demo.repository';
import { DemoService } from './services/demo.service';
import { ScenarioLoaderService } from './services/scenario-loader.service';
import { ScenarioResetService } from './services/scenario-reset.service';
import { ScenarioService } from './services/scenario.service';

@Module({
  controllers: [DemoController],
  providers: [
    DemoRepository,
    DemoService,
    ScenarioService,
    ScenarioLoaderService,
    ScenarioResetService,
  ],
  exports: [
    DemoRepository,
    DemoService,
    ScenarioService,
    ScenarioLoaderService,
    ScenarioResetService,
  ],
})
export class DemoModule {}
