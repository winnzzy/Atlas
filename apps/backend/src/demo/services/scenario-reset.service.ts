import { Injectable } from '@nestjs/common';
import type { DemoResetResultDto } from '../dto';
import type { DemoRepository } from '../repositories/demo.repository';

@Injectable()
export class ScenarioResetService {
  constructor(private readonly repository: DemoRepository) {}

  resetAll(): DemoResetResultDto {
    this.repository.reset();
    return {
      resetAt: new Date().toISOString(),
      scenarioCount: 0,
    };
  }
}
