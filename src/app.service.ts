import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Metrics } from './entity/metrics.entity';
import { Repository } from 'typeorm';
import { DTOMetrics } from './dto/metrics.dto';
import { DTOReport } from './dto/report.dto';
import * as XLSX from 'xlsx';
import { Response } from 'express';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Metrics)
    private metricRepo: Repository<Metrics>,
  ) {}

  async metrics({ aggType, dateInitial, finalDate, metricId }: DTOMetrics) {
    let dateFormat: string;

    switch (aggType) {
      case 'DAY':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'MONTH':
        dateFormat = 'YYYY-MM';
        break;
      case 'YEAR':
        dateFormat = 'YYYY';
        break;
      default:
        throw new Error('Aggregation type must be DAY, MONTH, or YEAR');
    }

    const result = await this.metricRepo
      .createQueryBuilder('metrics')
      .select(`TO_CHAR(metrics.event, '${dateFormat}')`, 'date')
      .addSelect('SUM(metrics.value)', 'value')
      .where('metrics.metricId = :metricId', { metricId: metricId })
      .andWhere('metrics.event >= :dateInitial', {
        dateInitial: dateInitial,
      })
      .andWhere('metrics.event <= :finalDate', { finalDate: finalDate })
      .groupBy(`TO_CHAR(metrics.event, '${dateFormat}')`)
      .orderBy('date', 'ASC')
      .getRawMany();

    return result;
  }

  async report({ metricId, dateInitial, finalDate }: DTOReport, res: Response) {
    const result = await this.metricRepo
      .createQueryBuilder('metrics')
      .select('metrics.metricId', 'MetricId')
      .addSelect("TO_CHAR(metrics.event, 'YYYY-MM-DD')", 'DateTime')
      .addSelect('SUM(metrics.value)', 'Aggday')
      .where('metrics.metricId = :metricId', { metricId })
      .andWhere('metrics.event >= :dateInitial', { dateInitial })
      .andWhere('metrics.event <= :finalDate', { finalDate })
      .groupBy("metrics.metricId, TO_CHAR(metrics.event, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(metrics.event, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    const aggregatedResult = result.map((row, index, array) => {
      const currentDate = row.DateTime;

      const aggMonth = array
        .filter((r) => r.DateTime?.slice(0, 7) === currentDate?.slice(0, 7))
        .reduce((sum, r) => sum + parseInt(r.Aggday, 10), 0);

      const aggYear = array
        .filter((r) => r.DateTime?.slice(0, 4) === currentDate?.slice(0, 4))
        .reduce((sum, r) => sum + parseInt(r.Aggday, 10), 0);

      return {
        ...row,
        AggMonth: aggMonth.toString(),
        AggYear: aggYear.toString(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(aggregatedResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Metrics Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=metrics_report_${metricId}.xlsx`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.send(buffer);
  }
}
