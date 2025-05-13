import { UseFilters, UseInterceptors } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";
import { ResponseTimeInterceptor } from "../../logger/response-time.interceptor.js";
import { SupplementReadService } from "../service/supplement-read.service.js";
import { getLogger } from "../../logger/logger.js";
import { Public } from "nest-keycloak-connect";
import { HttpExceptionFilter } from './http-exception.filter.js';
import { Supplement } from "../entity/supplement.entity.js";


export type IdInput = {
    readonly id: number;
}

@Resolver('Supplement')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class SupplementQueryResolver {
    readonly #service: SupplementReadService;

    readonly #logger = getLogger(SupplementQueryResolver.name);

    constructor(service: SupplementReadService) {
        this.#service = service;
        console.log('🚀 SupplementQueryResolver wurde geladen');
    }

    @Query(() => Supplement, {name: 'supplement'})
    @Public()
    async findById(@Args() { id }: IdInput) {
        console.log('✅ findById() wurde aufgerufen');

        this.#logger.debug('findById: id=%d', id);

        const supplement = await this.#service.findById({ id })

        if(this.#logger.isLevelEnabled('debug')){
            this.#logger.debug(
                'findById: supplement=%s, name=%o',
                supplement.toString(),
                supplement.name,
            );
        }
        return supplement;
    }
}
