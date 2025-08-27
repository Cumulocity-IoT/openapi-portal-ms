import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {
    // this.scheduler.handleCron();
  }

  @Get('/health')
  checkHealth() {
    return {
      status: 'UP',
    };
  }
}
