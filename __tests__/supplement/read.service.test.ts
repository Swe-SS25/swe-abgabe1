import { NotFoundException } from '@nestjs/common';
import { SupplementReadService } from '../../src/supplement/service/supplement-read.service.js';
import { Supplement } from '../../src/supplement/entity/supplement.entity.js';
import { SupplementFile } from '../../src/supplement/entity/supplementFile.entity.js';

const queryBuilderMock = {
  buildId: jest.fn(),
  build: jest.fn(),
};

const fileRepoMock: any = {
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

describe('SupplementReadService', () => {
  let service: SupplementReadService;

  beforeEach(() => {
    service = new SupplementReadService(queryBuilderMock as any, fileRepoMock);
    jest.clearAllMocks();
  });

  it('returns a supplement for a given id', async () => {
    const supplement = { id: 1, version: 0 } as Supplement;
    queryBuilderMock.buildId.mockReturnValue({ getOne: jest.fn().mockResolvedValue(supplement) });

    await expect(service.findById({ id: 1 })).resolves.toBe(supplement);
  });

  it('throws NotFoundException when supplement is missing', async () => {
    queryBuilderMock.buildId.mockReturnValue({ getOne: jest.fn().mockResolvedValue(null) });

    await expect(service.findById({ id: 4711 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns undefined when no file exists', async () => {
    fileRepoMock.getOne.mockResolvedValue(null);

    await expect(service.findFileBySupplementId(1)).resolves.toBeUndefined();
  });
});
