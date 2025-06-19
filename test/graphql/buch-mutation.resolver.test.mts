import { beforeAll, describe, expect, inject, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLQuery, type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

const token = inject('tokenGraphql');
const tokenUser = inject('tokenGraphqlUser');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const supplementNeu = {
    name: 'Test Supplement',
    portionen: 10,
    supplementArt: 'PULVER',
};
const supplementUpdate = {
    name: 'Vitamin C',
    portionen: 99,
    supplementArt: 'KAPSELN',
};
const supplementUpdateInvalid = {
    name: '',
    portionen: -1,
    supplementArt: 'unbekannt',
};
const idVorhanden = '30';
const idNichtVorhanden = '999999';
const versionVorhanden = 0;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
describe('GraphQL Supplement Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    beforeAll(async () => {
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    // -------------------------------------------------------------------------
    test.concurrent('Supplement anlegen', async () => {
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(input: {
                        name: "${supplementNeu.name}",
                        portionen: ${supplementNeu.portionen},
                        supplementArt: ${supplementNeu.supplementArt}
                    }) {
                        id
                    }
                }
            `,
        };

        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        expect(status).toBe(200);
        if (data.errors) {
            // Prüfe auf den erwarteten Fehler bei Duplikaten
            expect(data.errors[0].message).toMatch(/duplicate key value/i);
        } else {
            expect(data.data?.create?.id).toBeDefined();
        }
    });

    test.concurrent('Supplement anlegen ohne Token', async () => {
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(input: {
                        name: "${supplementNeu.name}",
                        portionen: ${supplementNeu.portionen},
                        supplementArt: ${supplementNeu.supplementArt}
                    }) {
                        id
                    }
                }
            `,
        };
        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        expect(status).toBe(200);
        expect(data.errors?.[0].message).toMatch(
            /Unauthorized|Forbidden resource/iu,
        );
        // Wenn kein Fehlerobjekt für "data.create" existiert, ist es undefined, nicht null
        expect(data.data?.create).toBeUndefined();
    });

    test.concurrent('Supplement aktualisieren', async () => {
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(input: {
                        id: "40",
                        version: 1,
                        name: "${supplementUpdate.name}",
                        portionen: ${supplementUpdate.portionen},
                        supplementArt: ${supplementUpdate.supplementArt}
                    }) {
                        version
                    }
                }
            `,
        };

        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        expect(status).toBe(200);
        expect(data.errors).toBeUndefined();
        expect(data.data?.update?.version).toBeDefined();
    });

    test.concurrent('Nicht-vorhandenes Supplement aktualisieren', async () => {
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(input: {
                        id: "90000",
                        version: 1,
                        name: "${supplementUpdate.name}",
                        portionen: ${supplementUpdate.portionen},
                        supplementArt: ${supplementUpdate.supplementArt}
                    }) {
                        version
                    }
                }
            `,
        };

        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });
        expect(status).toBe(200);
        expect(data.errors).toBeDefined();
        expect(data.errors?.length).toBeGreaterThan(0);
        expect(data.data).toBeNull();
    });

    test.concurrent('Supplement löschen', async () => {
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${idVorhanden}")
                }
            `,
        };

        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        expect(status).toBe(200);
        expect(data.errors).toBeUndefined();
        expect(data.data?.delete).toBe(true);
    });

    test.concurrent('Nicht-vorhandenes Supplement löschen', async () => {
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${idNichtVorhanden}")
                }
            `,
        };

        const { status, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        expect(status).toBe(200);
        expect(data.errors).toBeDefined();
        expect(data.errors?.length).toBeGreaterThan(0);
        expect(data.data).toBeNull();
    });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
