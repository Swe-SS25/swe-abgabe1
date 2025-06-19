import { type GraphQLRequest } from '@apollo/server';
import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type Supplement } from '../../src/supplement/entity/supplement.entity.js';
import { type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';
const nameVorhanden = 'creatin';
const nameTeilVorhanden = 'rea';
const nameNichtVorhanden = 'unbekannt';
const portionenMin = 10;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('GraphQL Supplement Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    beforeAll(async () => {
        const baseUrlGraphQL = `${baseURL}/graphql`;
        client = axios.create({
            baseURL: baseUrlGraphQL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Supplement zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    supplement(id: ${idVorhanden}) {
                        version
                        name
                        portionen
                        supplementArt
                        beschreibung {
                            info
                            dosierempfehlung
                            vorteile
                        }
                        produktbilder {
                            bezeichnung
                            path
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { supplement } = data.data!;
        expect(supplement.name?.toLowerCase()).toContain(nameTeilVorhanden);
        expect(supplement.version).toBeGreaterThanOrEqual(0);
        expect(supplement.portionen).toBeGreaterThanOrEqual(0);
    });

    test.concurrent('Supplement zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    supplement(id: ${id}) {
                        name
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.supplement).toBeNull();

        const { errors } = data;
        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt kein Supplement mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('supplement');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Supplements zu vorhandenem Namen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    supplements(suchkriterien: {
                        name: "${nameVorhanden}"
                    }) {
                        name
                        supplementArt
                        portionen
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { supplements } = data.data!;
        expect(supplements).not.toHaveLength(0);

        supplements.forEach((supplement: Supplement) =>
            expect(supplement.name?.toLowerCase()).toContain(nameVorhanden),
        );
    });

    test.concurrent('Supplements zu teilweisem Namen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    supplements(suchkriterien: {
                        name: "${nameTeilVorhanden}"
                    }) {
                        name
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { supplements } = data.data!;
        expect(supplements).not.toHaveLength(0);

        supplements.forEach((supplement: Supplement) =>
            expect(supplement.name?.toLowerCase()).toContain(nameTeilVorhanden),
        );
    });

    test.concurrent('Supplements zu nicht-vorhandenem Namen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    supplements(suchkriterien: {
                        name: "${nameNichtVorhanden}"
                    }) {
                        name
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.supplements).toBeNull();

        const { errors } = data;
        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Supplements gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('supplements');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Supplements mit Mindest-Portionen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    supplements(suchkriterien: {
                        portionen: ${portionenMin}
                    }) {
                        portionen
                        name
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { supplements } = data.data!;
        expect(supplements).not.toHaveLength(0);

        supplements.forEach((supplement: Supplement) =>
            expect(supplement.portionen).toBeGreaterThanOrEqual(portionenMin),
        );
    });

    // Du kannst weitere Suchkriterien analog zu den Feldern deines Modells testen (supplementArt, vorteile etc.)
});
