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

/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produktbild } from '../entity/produktbild.entity.js';
import { Supplement } from '../entity/supplement.entity.js';
import { Suchkriterien } from './suchkriterien.js';
import {
    DEFAULT_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    Pageable,
} from './pageable.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';
import { Beschreibung } from '../entity/beschreibung.entity.js';

/** Typdefinitionen für die Suche mit der Supplement-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Supplements. */
    readonly id: number;
    /** Sollen die Produktbild mitgeladen werden? */
    readonly mitProduktbildern?: boolean;
};
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Supplements und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #supplementAlias = `${Supplement.name
        .charAt(0)
        .toLowerCase()}${Supplement.name.slice(1)}`;

    readonly #produktbildAlias = `${Produktbild.name
        .charAt(0)
        .toLowerCase()}${Produktbild.name.slice(1)}`;

    readonly #beschreibungAlias = `${Beschreibung.name
        .charAt(0)
        .toLowerCase()}${Beschreibung.name.slice(1)}`;

    readonly #repo: Repository<Supplement>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Supplement) repo: Repository<Supplement>) {
        this.#repo = repo;
    }

    /**
     * Ein Supplement mit der ID suchen.
     * @param id ID des gesuchten Supplements
     * @returns QueryBuilder
     */
    buildId({ id, mitProduktbildern = false }: BuildIdParams) {
        // QueryBuilder "supplement" fuer Repository<Supplement>
        const queryBuilder = this.#repo.createQueryBuilder(
            this.#supplementAlias,
        );

        // Fetch-Join: aus QueryBuilder "supplement" die Property "beschreibung" ->  Tabelle "beschreibung"
        queryBuilder.innerJoinAndSelect(
            `${this.#supplementAlias}.beschreibung`,
            this.#beschreibungAlias,
        );

        if (mitProduktbildern) {
            // Fetch-Join: aus QueryBuilder "supplement" die Property "produktbild" -> Tabelle "produktbild"
            queryBuilder.leftJoinAndSelect(
                `${this.#supplementAlias}.produktbilder`,
                this.#produktbildAlias,
            );
        }

        queryBuilder.where(`${this.#supplementAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Supplements asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien. Bei "beschreibung" wird mit
     * einem Teilstring gesucht, bei "rating" mit einem Mindestwert, bei "preis"
     * mit der Obergrenze.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns QueryBuilder
     */
    // z.B. { titel: 'a', rating: 5, preis: 22.5, javascript: true }
    // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
    // eslint-disable-next-line max-lines-per-function, prettier/prettier, sonarjs/cognitive-complexity
    build(
        { name, beschreibung, ...restProps }: Suchkriterien,
        pageable: Pageable,
    ) {
        this.#logger.debug(
            'name=%s, beschreibung=%s, restProps=%o, pageable=%o',
            name,
            beschreibung,
            restProps,
            pageable,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#supplementAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#supplementAlias}.beschreibung`,
            'beschreibung',
        );

        let useWhere = true;

        if (name !== undefined && typeof name === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#supplementAlias}.name ${ilike} :name`,
                { name: `%${name}%` },
            );
            useWhere = false;
        }
        // Beschreibung in der Query: Teilstring der Beschreibung und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (beschreibung !== undefined && typeof beschreibung === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#beschreibungAlias}.info ${ilike} :beschreibung`,
                { beschreibung: `%${beschreibung}%` },
            );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.entries(restProps).forEach(([key, value]) => {
            const param: Record<string, any> = {};
            param[key] = value; // eslint-disable-line security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#supplementAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#supplementAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());

        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}
