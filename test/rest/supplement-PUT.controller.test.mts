import { beforeAll, describe, expect, inject, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type SupplementDtoOhneRef } from '../../src/supplement/controller/supplementDTO.entity.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

const token = inject('tokenRest');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaendertesSupplement: SupplementDtoOhneRef = {
    name: 'Vitamin C',
    portionen: 50,
    supplementArt: 'KAPSELN',
};
const idVorhanden = '1';

const geaendertesSupplementIdNichtVorhanden: SupplementDtoOhneRef = {
    name: 'Kalium',
    portionen: 25,
    supplementArt: 'PULVER',
};
const idNichtVorhanden = '999999';

const geaendertesSupplementInvalid: Record<string, unknown> = {
    name: '',
    portionen: -1,
    supplementArt: 'unbekannt',
};

const veraltesSupplement: SupplementDtoOhneRef = {
    name: 'Kalium',
    portionen: 42,
    supplementArt: 'PULVER',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('PUT /rest/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    beforeAll(async () => {
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('Vorhandenes Supplement aendern', async () => {
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaendertesSupplement,
            { headers },
        );

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Supplement aendern', async () => {
        const url = `/rest/${idNichtVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        const { status }: AxiosResponse<string> = await client.put(
            url,
            geaendertesSupplementIdNichtVorhanden,
            { headers },
        );

        expect(status).toBe(HttpStatus.NOT_FOUND);
    });

    test('Vorhandenes Supplement aendern, aber mit ungueltigen Daten', async () => {
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        const expectedMsg = [
            expect.stringMatching(/^name /u),
            expect.stringMatching(/^portionen /u),
            expect.stringMatching(/^supplementArt /u),
        ];

        const { status, data }: AxiosResponse<Record<string, any>> =
            await client.put(url, geaendertesSupplementInvalid, { headers });

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        expect(messages.length).toBeGreaterThanOrEqual(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Vorhandenes Supplement aendern, aber ohne Versionsnummer', async () => {
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geaendertesSupplement,
            { headers },
        );

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenes Supplement aendern, aber mit alter Versionsnummer', async () => {
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        const { status, data }: AxiosResponse<Record<string, any>> =
            await client.put(url, veraltesSupplement, { headers });

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);

        const { message, statusCode } = data;

        expect(message).toMatch(/Versionsnummer/u);
        expect(statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
    });

    test('Vorhandenes Supplement aendern, aber ohne Token', async () => {
        const url = `/rest/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesSupplement,
            { headers },
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('Vorhandenes Supplement aendern, aber mit falschem Token', async () => {
        const url = `/rest/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesSupplement,
            { headers },
        );

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
});
