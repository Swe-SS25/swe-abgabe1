import { Injectable, NotFoundException } from "@nestjs/common";
import { Supplement } from '../entity/supplement.entity.js';
import { getLogger } from "../../logger/logger.js";
import { QueryBuilder } from './query-builder.js';
import { Suchkriterien } from "./suchkriterien";
import { Pageable } from "./pageable";
import { Slice } from "./slice";

export type FindByIDParams = {
    readonly id: number;
    readonly mitProduktbildern?: boolean;
};

@Injectable()
export class SupplementReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #queryBuilder: QueryBuilder;

    readonly #supplementProps: string[];
    
    readonly #logger = getLogger(SupplementReadService.name);

    constructor(
        queryBuilder: QueryBuilder,
    ){
        this.#queryBuilder = queryBuilder;
        const supplementDummy = new Supplement();
        this.#supplementProps = Object.getOwnPropertyNames(supplementDummy);
    }

    /**
     * Ein Supplement asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Supplements
     * @returns Das gefundene Suppplement in einem Promise aus ES2015.
     * @throws NotFoundException falls kein Supplement mit der ID existiert
     */
    async findById({
        id, mitProduktbildern = false
    }: FindByIDParams): Promise<Readonly<Supplement>>{
        this.#logger.debug('findById: id=%d', id);

        const supplement = await this.#queryBuilder
            .buildId({ id, mitProduktbildern })
            .getOne();

            if (supplement === null) {
                throw new NotFoundException(`Es gibt kein Supplement mit der ID ${id}.`);
            }

        return supplement;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     * @throws NotFoundException falls keine Bücher gefunden wurden.
     */
    async find(
        suchkriterien: Suchkriterien | undefined,
        pageable: Pageable,
    ): Promise<Slice<Supplement>> {
        this.#logger.debug(
            'find: suchkriterien=%o, pageable=%o',
            suchkriterien,
            pageable,
        );

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys) || !this.#checkEnums(suchkriterien)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const queryBuilder = this.#queryBuilder.build(suchkriterien, pageable);
        const supplements = await queryBuilder.getMany();
        if (supplements.length === 0) {
            this.#logger.debug('find: Keine Supplements gefunden');
            throw new NotFoundException(
                `Keine Supplements gefunden: ${JSON.stringify(suchkriterien)}, Seite ${pageable.number}}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(supplements, totalElements);
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const supplements = await queryBuilder.getMany();
        if (supplements.length === 0) {
            throw new NotFoundException(`Ungueltige Seite "${pageable.number}"`);
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(supplements, totalElements);
    }

    #createSlice(supplements: Supplement[], totalElements: number) {
        const supplementSlice: Slice<Supplement> = {
            content: supplements,
            totalElements,
        };
        this.#logger.debug('createSlice: supplementSlice=%o', supplementSlice);
        return supplementSlice;
    }

    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%s', keys);
        // Ist jedes Suchkriterium auch eine Property von Buch oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#supplementProps.includes(key)
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }

    #checkEnums(suchkriterien: Suchkriterien) {
        const { art } = suchkriterien;
        this.#logger.debug('#checkEnums: Suchkriterium "art=%s"', art);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return (
            art === undefined ||
            art === 'pulver' ||
            art === 'tabletten' ||
            art === 'kapseln'
        );
    }
}