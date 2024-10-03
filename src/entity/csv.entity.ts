import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('csv_files')
export class CsvFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  md5: string;

  @Column()
  filePath: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
