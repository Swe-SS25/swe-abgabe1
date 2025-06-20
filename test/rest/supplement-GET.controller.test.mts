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
const beschreibungVorhanden = 'a';
const nameNichtVorhanden = 'unbekanntes-supplement';
const portionenMin = 1;
const supplementArtVorhanden = 'PULVER';
const supplementArtNichtVorhanden = 'unknownart';
const vorteilVorhanden = 'muskelaufbau';
const vorteilNichtVorhanden = 'unicorn-power';
const teilbeschreibung = 'Hochdosiertes Vitamin C';

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
        const params = { beschreibung: beschreibungVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<Page<Supplement>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((supplement) => supplement.beschreibung)
            .forEach((beschreibung) =>
                expect(beschreibung?.info?.toLowerCase()).toStrictEqual(
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
                expect(art).toBe(supplementArtVorhanden),
            );
    });

    test.concurrent(
        'liefert Supplements mit vorhandener supplementArt',
        async () => {
            // given
            const params = { supplementArt: supplementArtNichtVorhanden };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        },
    );


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
