import { NotFoundException } from '@nestjs/common';
import { SupplementGetController } from '../../src/supplement/controller/supplement-get.controller.js';
import { SupplementReadService } from '../../src/supplement/service/supplement-read.service.js';

const serviceMock = {
  findById: jest.fn(),
};

describe('SupplementGetController', () => {
  let controller: SupplementGetController;

  beforeEach(() => {
    controller = new SupplementGetController(serviceMock as any);
    jest.clearAllMocks();
  });

  it('should return 200 and supplement', async () => {
    const supplement = { id: 1, version: 0 } as any;
    serviceMock.findById.mockResolvedValue(supplement);
    const req: any = { accepts: jest.fn().mockReturnValue(true) };
    const res: any = { header: jest.fn(), json: jest.fn().mockReturnThis(), sendStatus: jest.fn() };

    await controller.getById(1, req, undefined, res);

    expect(res.json).toHaveBeenCalledWith(supplement);
  });

  it('should propagate NotFoundException', async () => {
    serviceMock.findById.mockRejectedValue(new NotFoundException());
    const req: any = { accepts: jest.fn().mockReturnValue(true) };
    const res: any = { sendStatus: jest.fn() };

    await expect(controller.getById(99, req, undefined, res)).rejects.toBeInstanceOf(NotFoundException);
  });
});
