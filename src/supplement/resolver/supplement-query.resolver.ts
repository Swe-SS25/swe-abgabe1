import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { SupplementReadService } from '../service/supplement-read.service.js';
import { getLogger } from '../../logger/logger.js';
import { Public } from 'nest-keycloak-connect';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { Suchkriterien } from '../service/suchkriterien.js';
import { createPageable } from '../service/pageable.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Supplement')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class SupplementQueryResolver {
    readonly #service: SupplementReadService;

    readonly #logger = getLogger(SupplementQueryResolver.name);

    constructor(service: SupplementReadService) {
        this.#service = service;
    }

    @Query('supplement')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const supplement = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: supplement=%s, name=%o',
                supplement.toString(),
                supplement.name,
            );
        }
        return supplement;
    }
    @Query('supplements')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const pageable = createPageable({});
        const supplementsSlice = await this.#service.find(
            input?.suchkriterien,
            pageable,
        );
        this.#logger.debug('find: supplementsSlice=%o', supplementsSlice);
        return supplementsSlice.content;
    }
}
