import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('metrics')
@Index(['metricId', 'event'])
export class Metrics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  metricId: number;

  @Column({ type: 'timestamp' })
  event: Date;

  @Column({ type: 'int' })
  value: number;
}
