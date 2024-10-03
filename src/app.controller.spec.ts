/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Metrics } from './entity/metrics.entity';
import { Repository } from 'typeorm';
import { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let metricsRepository: Repository<Metrics>;

  const mockMetrics = [
    {
      metricId: 1,
      date: '2023-11-21',
      AggDay: '532',
      AggMonth: '1000',
      AggYear: '1500',
    },
    {
      metricId: 1,
      date: '2023-11-22',
      AggDay: '192',
      AggMonth: '1192',
      AggYear: '1692',
    },
  ];

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(mockMetrics),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Metrics),
          useValue: mockRepository, // Mock do repositório
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
    metricsRepository = module.get<Repository<Metrics>>(
      getRepositoryToken(Metrics),
    );
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should return aggregated metrics data for getMetrics', async () => {
    const result = await appController.getMetrics({
      metricId: '218218',
      aggType: 'DAY',
      dateInitial: '2023-11-01',
      finalDate: '2023-11-30',
    });

    expect(result).toEqual(mockMetrics);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockRepository.getRawMany).toHaveBeenCalled();
  });

  it('should generate and download an Excel file for report', async () => {
    const mockResponse = {
      download: jest.fn((filePath, filename, callback) => callback(null)),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await appController.report(
      {
        metricId: '218218',
        dateInitial: '2023-11-01',
        finalDate: '2023-11-30',
      },
      mockResponse,
    );

    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    expect(mockResponse.download).toHaveBeenCalled();
  });
});
