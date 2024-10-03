import { IsIn } from 'class-validator';
import { DTOReport } from './report.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DTOMetrics extends DTOReport {
  @ApiProperty()
  @IsIn(['DAY', 'MONTH', 'YEAR'])
  aggType: 'DAY' | 'MONTH' | 'YEAR';
}
