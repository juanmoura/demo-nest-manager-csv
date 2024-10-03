import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { DTOMetrics } from './dto/metrics.dto';
import { DTOReport } from './dto/report.dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@Controller('extraction/v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiTags('metrics')
  @Get('metrics/:metricId/:aggType/:dateInitial/:finalDate')
  getMetrics(@Param() param: DTOMetrics) {
    return this.appService.metrics({
      aggType: param.aggType,
      dateInitial: param.dateInitial,
      finalDate: param.finalDate,
      metricId: param.metricId,
    });
  }

  @ApiTags('report')
  @Get('report/:metricId/:dateInitial/:finalDate')
  report(@Param() param: DTOReport, @Res() response: Response) {
    return this.appService.report(
      {
        dateInitial: param.dateInitial,
        finalDate: param.finalDate,
        metricId: param.metricId,
      },
      response,
    );
  }
}
