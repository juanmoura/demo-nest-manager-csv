import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fastCsv from 'fast-csv';
import { CsvFile } from '../entity/csv.entity';
import { Metrics } from 'src/entity/metrics.entity';

@Injectable()
export class CsvProcessingService implements OnModuleInit {
  private readonly logger = new Logger('process-csv');
  constructor(
    @InjectRepository(CsvFile)
    private readonly csvRepo: Repository<CsvFile>,
    @InjectRepository(Metrics)
    private readonly metricRepo: Repository<Metrics>,
  ) {}

  async onModuleInit() {
    const folderPath = path.join(__dirname, '../assets');
    this.logger.log(`searching csvs to import on ${folderPath}`);
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith('.csv'));

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const md5 = await this.calculateFileHash(filePath);

      this.logger.log(`[${file}] processing`);

      const existingFile = await this.csvRepo.findOne({
        where: { md5 },
      });
      if (!existingFile) {
        const result = await this.processCsv(filePath);
        if (result) {
          const newCsvFile = this.csvRepo.create({ md5, filePath });
          await this.csvRepo.save(newCsvFile);
        }
      } else {
        this.logger.log(`[${file}] already processed`);
      }
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('md5');
    const fileStream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        hash.update(chunk);
      });
      fileStream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      fileStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  private convertToISOString(dateString: string): string {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    const isoString = date.toISOString();
    return isoString;
  }

  private async processCsv(filePath: string): Promise<boolean> {
    const readStream = fs.createReadStream(filePath);
    const splittedPath = filePath.split('/');
    return new Promise((resolve, reject) => {
      readStream
        .pipe(fastCsv.parse({ headers: true, delimiter: ';' }))
        .on('data', async (row) => {
          await this.metricRepo.save(
            this.metricRepo.create({
              metricId: parseInt(row.metricId),
              event: new Date(this.convertToISOString(row.dateTime)),
              value: parseInt(row.value),
            }),
          );
        })
        .on('end', () => {
          this.logger.log(`${splittedPath[splittedPath.length - 1]} Completed`);
          resolve(true);
        })
        .on('error', (error) => {
          this.logger.error(
            `${splittedPath[splittedPath.length - 1]} Error:`,
            error,
          );
          reject(error);
        });
    });
  }
}
