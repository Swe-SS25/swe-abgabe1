// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { beforeAll, describe, expect, inject, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type SupplementDTO } from '../../src/supplement/controller/supplementDTO.entity.js';
import { SupplementReadService } from '../../src/supplement/service/supplement-read.service.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

const token = inject('tokenRest');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuesSupplement: SupplementDTO = {
    name: 'Creatin Monohydrat',
    portionen: 60,
    supplementArt: 'PULVER',
    beschreibung: {
        info: 'Zur Unterstützung des Muskelaufbaus',
        dosierempfehlung: '5g pro Tag',
        vorteile: 'muskelaufbau',
    },
    produktbilder: [
        {
            bezeichnung: 'Dose',
            path: 'creatin-dose.png',
        },
    ],
};
const neuesSupplementInvalid: Record<string, unknown> = {
    name: '',
    portionen: -10,
    supplementArt: 'unbekannt',
    beschreibung: {
        info: '',
        dosierempfehlung: '',
        vorteile: '',
    },
    produktbilder: [
        {
            bezeichnung: '',
            path: '',
        },
    ],
};
const neuesSupplementNameExistiert: SupplementDTO = {
    name: 'Creatin Monohydrat', // muss vorher schon in der DB sein!
    portionen: 60,
    supplementArt: 'pulver',
    beschreibung: {
        info: 'Schon vorhanden',
        dosierempfehlung: '5g',
        vorteile: 'muskelaufbau',
    },
    produktbilder: [],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('POST /rest', () => {
    let client: AxiosInstance;
    const restURL = `${baseURL}/rest`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('Neues Supplement', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;
        console.log(`Token: ${headers.Authorization}`);

        // when
        const response: AxiosResponse<string> = await client.post(
            '',
            neuesSupplement,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };
        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        // Passe das Pattern ggf. an, falls SupplementReadService.ID_PATTERN vorhanden ist!
        expect(/^\d+$/.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test.concurrent('Neues Supplement mit ungueltigen Daten', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^name /u),
            expect.stringMatching(/^portionen /u),
            expect.stringMatching(/^supplementArt /u),
            // ggf. weitere Feld-Validierungs-Fehlermeldungen
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesSupplementInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        // Passe expectedMsg.length ggf. an deine Validierungen an!
        expect(messages.length).toBeGreaterThanOrEqual(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test.concurrent(
        'Neues Supplement, aber der Name existiert bereits',
        async () => {
            // given
            headers.Authorization = `Bearer ${token}`;

            // when
            const response: AxiosResponse<ErrorResponse> = await client.post(
                '',
                neuesSupplementNameExistiert,
                { headers },
            );

            // then
            const { data } = response;

            const { message, statusCode } = data;

            expect(message).toStrictEqual(expect.stringContaining('Name'));
            expect(statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        },
    );

    test.concurrent('Neues Supplement, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesSupplement,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent('Neues Supplement, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesSupplement,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent.todo('Abgelaufener Token');
});
