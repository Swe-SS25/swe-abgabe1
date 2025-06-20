// Tests mit
//  * Vitest    https://vitest.dev
//  * jest      https://jestjs.io
//  * Mocha     https://mochajs.org
//  * node:test ab Node 18 https://nodejs.org/download/rc/v18.0.0-rc.1/docs/api/test.html

// https://github.com/testjavascript/nodejs-integration-tests-best-practices
// axios: https://github.com/axios/axios

// Alternativen zu axios:
// https://github.com/request/request/issues/3143
// https://blog.bitsrc.io/comparing-http-request-libraries-for-2019-7bedb1089c83
//    got         https://github.com/sindresorhus/got
//    node-fetch  https://github.com/node-fetch/node-fetch
//                https://fetch.spec.whatwg.org
//                https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
//    needle      https://github.com/tomas/needle
//    ky          https://github.com/sindresorhus/ky

import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type Supplement } from '../../src/supplement/entity/supplement.entity.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';
const idNichtVorhanden = '999999';
const idFalsch = 'xy';
const versionVorhanden = '0';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        const restUrl = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restUrl,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test.concurrent('Supplement zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const { status, headers, data }: AxiosResponse<Supplement> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { id } = data;
        expect(id?.toString()).toBe(idVorhanden);
    });

    test.concurrent('Kein Supplement zu nicht-vorhandener ID', async () => {
        // given
        const url = `/${idNichtVorhanden}`;

        // when
        const { status, data }: AxiosResponse<ErrorResponse> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, message, statusCode } = data;
        expect(error).toBe('Not Found');
        expect(message).toStrictEqual(expect.stringContaining(message));
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test.concurrent('Kein Supplement zu falscher ID', async () => {
        // given
        const url = `/${idFalsch}`;

        // when
        const { status, data }: AxiosResponse<ErrorResponse> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;
        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
});
