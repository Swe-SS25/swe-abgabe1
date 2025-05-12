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

    readonly #repo: Repository<Supplement>;

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
        const queryBuilder = this.#repo.createQueryBuilder(this.#supplementAlias);

        // Fetch-Join: aus QueryBuilder "supplement" die Property "beschreibung" ->  Tabelle "beschreibung"
        queryBuilder.innerJoinAndSelect(
            `${this.#supplementAlias}.beschreibung`,
            this.#produktbildAlias,
        );

        if (mitProduktbildern) {
            // Fetch-Join: aus QueryBuilder "buch" die Property "produktbild" -> Tabelle "produktbild"
            queryBuilder.leftJoinAndSelect(
                `${this.#supplementAlias}.produktbild`,
                this.#produktbildAlias,
            );
        }

        queryBuilder.where(`${this.#supplementAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }
}
