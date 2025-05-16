import axios from 'axios';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SupplementGetController } from '../../src/supplement/controller/supplement-get.controller.js';
import { SupplementReadService } from '../../src/supplement/service/supplement-read.service.js';

const serviceMock = {
  findById: jest.fn().mockResolvedValue({ id: 1, version: 0 }),
};

describe('Supplement e2e', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SupplementGetController],
      providers: [{ provide: SupplementReadService, useValue: serviceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 0 : address.port;
    url = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /rest/1', async () => {
    const response = await axios.get(`${url}/rest/1`);
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(1);
  });
});
