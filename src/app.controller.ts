import { Controller, Get } from "@nestjs/common";
import { SchedulerService } from "./service/scheduler.service";

@Controller()
export class AppController {
  constructor(private scheduler: SchedulerService) {
    this.scheduler.handleCron();
  }

  @Get("/health")
  checkHealth() {
    return {
      status: "UP",
    };
  }

  @Get("/lastRun")
  getLastRun() {
    return {
      lastRun: this.scheduler.lastRun,
      runDuration: this.scheduler.getDuration(),
      runs: this.scheduler.runs,
      isTaskRunning: this.scheduler.isTaskRunning,
    };
  }
}
