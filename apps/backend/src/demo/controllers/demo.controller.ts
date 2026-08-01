import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { DemoControlActionDto, DemoSimulatorActionDto, LoadScenarioDto } from '../dto';
import type { DemoService } from '../services/demo.service';
import type { ScenarioLoaderService } from '../services/scenario-loader.service';
import type { ScenarioResetService } from '../services/scenario-reset.service';

@ApiTags('Demo')
@ApiBearerAuth()
@Controller('demo')
export class DemoController {
  constructor(
    private readonly demoService: DemoService,
    private readonly scenarioLoaderService: ScenarioLoaderService,
    private readonly scenarioResetService: ScenarioResetService,
  ) {}

  @Get('state')
  @ApiOperation({ summary: 'Get full isolated demo state' })
  @ApiResponse({ status: 200, type: Object })
  getState() {
    return this.demoService.getSnapshot();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get investor demo dashboard metrics' })
  @ApiResponse({ status: 200, type: Object })
  getDashboard() {
    return this.demoService.getDashboard();
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get demo entity counts' })
  @ApiResponse({ status: 200, type: Object })
  getCounts() {
    return this.demoService.getCounts();
  }

  @Post('scenarios/load')
  @ApiOperation({ summary: 'Load deterministic demo scenario' })
  loadScenario(@Body() body: LoadScenarioDto) {
    return this.scenarioLoaderService.loadScenario(body.scenarioId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'One-click reset of all demo data' })
  reset() {
    return this.scenarioResetService.resetAll();
  }

  @Post('controls')
  @ApiOperation({ summary: 'Execute live demo control action' })
  runControl(@Body() body: DemoControlActionDto) {
    return this.demoService.executeControl(body);
  }

  @Post('simulators')
  @ApiOperation({ summary: 'Execute deterministic simulator action' })
  runSimulator(@Body() body: DemoSimulatorActionDto) {
    return this.demoService.executeSimulator(body);
  }
}
