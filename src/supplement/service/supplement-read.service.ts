import { Injectable, NotFoundException } from "@nestjs/common";
import { Supplement } from "../entity/supplement.entity";
import { getLogger } from "../../logger/logger.js";
import { QueryBuilder } from './query-builder.js';

export type FindByIDParams = {
    readonly id: number;
    readonly mitProduktbildern?: boolean;
};

@Injectable()
export class SupplementReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #queryBuilder: QueryBuilder;
    
    readonly #logger = getLogger(SupplementReadService.name);

    constructor(
        queryBuilder: QueryBuilder,
    ){
        this.#queryBuilder = queryBuilder;
    }

    async findById({
        id, mitProduktbildern = false
    }: FindByIDParams): Promise<Readonly<Supplement>>{
        this.#logger.debug('findById: id=%d', id);

        const supplement = await this.#queryBuilder
            .buildId({ id, mitProduktbildern })
            .getOne();

            if (supplement === null) {
                throw new NotFoundException(`Es gibt kein Buch mit der ID ${id}.`);
            }

        return supplement;
    }
}