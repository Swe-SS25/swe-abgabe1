import { beforeAll, describe, expect, test } from 'vitest';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLRequest } from '@apollo/server';
import { type Supplement } from '../../src/supplement/entity/supplement.entity.js';
import { type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

// Testdaten (passe sie ggf. an deine DB an)
const idVorhanden = '1';
const nameVorhanden = 'Vitamin C';
const nameTeilVorhanden = 'vitamin';
const nameNichtVorhanden = 'unbekanntes-supplement';
const portionenMin = 10;

describe('GraphQL Supplement Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    beforeAll(async () => {
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Supplement zu vorhandener ID', async () => {
        const body: GraphQLRequest = {
            query: `
                {
                    supplement(id: ${idVorhanden}) {
                        id
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

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data?.supplement).toBeDefined();

        const supplement = data.data!.supplement as Supplement;
        expect(supplement.id).toBeDefined();
        expect(supplement.name?.toLowerCase()).toContain(
            nameTeilVorhanden.toLowerCase(),
        );
        expect(supplement.portionen).toBeGreaterThanOrEqual(0);
    });

    test.concurrent('Supplement zu nicht-vorhandener ID', async () => {
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

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.supplement).toBeNull();

        const { errors } = data;
        expect(errors).toHaveLength(1);

        const [error] = errors!;
        expect(error.message).toMatch(/kein Supplement mit der ID/i);
        expect(error.path?.[0]).toBe('supplement');
        expect(error.extensions?.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Supplements zu vorhandenem Namen', async () => {
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

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data?.supplements).not.toHaveLength(0);

        data.data!.supplements.forEach((supplement: Supplement) =>
            expect(supplement.name?.toLowerCase()).toContain(
                nameVorhanden.toLowerCase(),
            ),
        );
    });

    test.concurrent('Supplements zu teilweisem Namen', async () => {
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

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data?.supplements).not.toHaveLength(0);

        data.data!.supplements.forEach((supplement: Supplement) =>
            expect(supplement.name?.toLowerCase()).toContain(
                nameTeilVorhanden.toLowerCase(),
            ),
        );
    });

    test.concurrent('Supplements zu nicht-vorhandenem Namen', async () => {
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

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeNull();

        const { errors } = data;
        expect(errors).toHaveLength(1);

        const [error] = errors!;
        expect(error.message).toMatch(/^Keine Supplements gefunden:/iu);
        expect(error.path?.[0]).toBe('supplements');
        expect(error.extensions?.code).toBe('BAD_USER_INPUT');
    });
});
