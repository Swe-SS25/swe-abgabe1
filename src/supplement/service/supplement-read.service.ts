import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Supplement } from "../entity/supplement.entity";
import { getLogger } from "../../logger/logger";
import { InjectRepository } from "@nestjs/typeorm";

export type FindByIDParams = {
    readonly id: number;
};

@Injectable()
export class SupplementReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #fileRepo: Repository<Supplement>;
    
    readonly #logger = getLogger(SupplementReadService.name);

    constructor(
        @InjectRepository(Supplement) fileRepo: Repository<Supplement>
    ){
        this.#fileRepo = fileRepo;
    }

    async findById({
        id
    }: FindByIDParams): Promise<Readonly<Supplement>>{
        this.#logger.debug('findById: id=%d', id);

        const supplement = await t

        return supplement;
    }
}