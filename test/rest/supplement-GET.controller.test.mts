import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type Supplement } from '../../src/supplement/entity/supplement.entity.js';
import { type Page } from '../../src/supplement/controller/page.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const nameVorhanden = 'vitamin c';
const supplementArtVorhanden = 'PULVER';
const nameNichtVorhanden = 'unbekanntes-supplement';
// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('GET /rest', () => {
    let restUrl: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        restUrl = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restUrl,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Alle Supplements', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.id)
            .forEach((id) => {
                expect(id).toBeDefined();
            });
    });

    test.concurrent('liefert Supplements mit vorhandenem Namen', async () => {
        const response = await client.get('/', {
            params: { name: nameVorhanden },
        });
        expect(response.status).toBe(HttpStatus.OK);
    });

    test.concurrent(
        'liefert Supplements mit vorhandener supplementArt',
        async () => {
            const response = await client.get('/', {
                params: { supplementArt: supplementArtVorhanden },
            });
            expect(response.status).toBe(HttpStatus.OK);
        },
    );

    test.concurrent(
        'liefert 404 für einen nicht vorhandenen Namen',
        async () => {
            const response = await client.get('/', {
                params: { name: nameNichtVorhanden },
            });
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.data).toBeDefined();
            expect(response.data).toMatchObject({
                message: expect.stringContaining('Keine Supplements gefunden'),
                error: 'Not Found',
                statusCode: 404,
            });
        },
    );
});
