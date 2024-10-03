import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumberString } from 'class-validator';

export class DTOReport {
  @ApiProperty()
  @IsNumberString()
  metricId: string;

  @ApiProperty()
  @IsDateString()
  dateInitial: string;

  @ApiProperty()
  @IsDateString()
  finalDate: string;
}
