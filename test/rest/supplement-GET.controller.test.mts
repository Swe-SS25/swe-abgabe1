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
const nameVorhanden = 'Vitam C';
const beschreibungVorhanden = 'Hochdosiertes Vitamin C aus Acerola'
const nameNichtVorhanden = 'unbekanntes-supplement';
const portionenMin = 20;
const supplementArtVorhanden = 'pulver';
const supplementArtNichtVorhanden = 'unknownart';
const vorteilVorhanden = 'muskelaufbau';
const vorteilNichtVorhanden = 'unicorn-power';

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

    test.concurrent('Supplements mit einem Teil-Beschreibung suchen', async () => {
        // given
        const params = { name: beschreibungVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.name)
            .forEach((name) =>
                expect(name).toStrictEqual(
                    expect.stringContaining(beschreibungVorhanden),
                ),
            );
    });

    test.concurrent(
        'Keine Supplements zu nicht-vorhandenem Namen',
        async () => {
            // given
            const params = { name: nameNichtVorhanden };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent('Supplements mit Mindest-Portionen suchen', async () => {
        // given
        const params = { portionen: portionenMin };

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.portionen)
            .forEach((portionen) =>
                expect(portionen).toBeGreaterThanOrEqual(portionenMin),
            );
    });

    test.concurrent('Supplements mit bestimmter Art suchen', async () => {
        // given
        const params = { supplementArt: supplementArtVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.supplementArt)
            .forEach((art) =>
                expect(art?.toLowerCase()).toBe(supplementArtVorhanden),
            );
    });

    test.concurrent(
        'Keine Supplements zu nicht-vorhandener Supplement-Art',
        async () => {
            // given
            const params = { supplementArt: supplementArtNichtVorhanden };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent('Mind. 1 Supplement mit vorhandenem Vorteil', async () => {
        // given
        const params = { vorteile: vorteilVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.beschreibung?.vorteile)
            .forEach((vorteile) =>
                expect(vorteile?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(vorteilVorhanden),
                ),
            );
    });

    test.concurrent(
        'Keine Supplements zu nicht-vorhandenem Vorteil',
        async () => {
            // given
            const params = { vorteile: vorteilNichtVorhanden };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent(
        'Keine Supplements zu einer nicht-vorhandenen Property',
        async () => {
            // given
            const params = { foo: 'bar' };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );
});
