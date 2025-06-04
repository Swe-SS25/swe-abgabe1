import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { Supplement } from '../entity/supplement.entity';
import { Beschreibung } from '../entity/beschreibung.entity';
import { Produktbild } from '../entity/produktbild.entity';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { SupplementDTO } from '../controller/supplementDTO.entity.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { SupplementWriteService } from '../service/supplement-write.service.js';
import { getLogger } from '../../logger/logger.js';
import { IdInput } from './supplement-query.resolver';

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class SupplementUpdateDTO extends SupplementDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}

@Resolver('Supplement')
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class SupplementMutationResolver {
    readonly #service: SupplementWriteService;

    readonly #logger = getLogger(SupplementMutationResolver.name);

    constructor(service: SupplementWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async create(@Args('input') supplementDTO: SupplementDTO) {
        this.#logger.debug('create: supplementDTO= %o', supplementDTO);

        const supplement = this.#supplementDtoToSupplement(supplementDTO);
        this.#logger.debug('create: supplement= %o', supplement);
        const id = await this.#service.create(supplement);
        this.#logger.debug('create: id=%d', id);
        const payload: CreatePayload = { id };

        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async update(@Args('input') supplementUpdateDTO: SupplementUpdateDTO) {
        this.#logger.debug(
            'update: supplementUpdateDTO= %o',
            supplementUpdateDTO,
        );

        const supplement =
            this.#supplementUpdateDtoToSupplement(supplementUpdateDTO);
        const versionStr = `"${supplementUpdateDTO.version.toString()}"`;
        const versionResult = await this.#service.update({
            id: Number.parseInt(supplementUpdateDTO.id, 10),
            supplement,
            version: versionStr,
        });
        this.#logger.debug('update: versionResult= %o', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%d', idStr);
        const deleted = await this.#service.delete(idStr);
        this.#logger.debug('delete: deleted=%s', deleted);
        return deleted;
    }

    #supplementDtoToSupplement(supplementDTO: SupplementDTO): Supplement {
        const beschreibungDTO = supplementDTO.beschreibung;
        const beschreibung: Beschreibung = {
            id: undefined,
            info: beschreibungDTO?.info,
            dosierempfehlung: beschreibungDTO?.dosierempfehlung,
            vorteile: beschreibungDTO?.vorteile,
            supplement: undefined,
        };

        const produktbilderDTO = supplementDTO.produktbilder?.map(
            (produktbildDTO) => {
                const produktbild: Produktbild = {
                    id: undefined,
                    bezeichnung: produktbildDTO.bezeichnung,
                    path: produktbildDTO.path,
                    supplement: undefined,
                };
                return produktbild;
            },
        );

        const supplement: Supplement = {
            id: undefined,
            version: undefined,
            name: supplementDTO.name,
            portionen: supplementDTO.portionen,
            supplementArt: supplementDTO.supplementArt,
            beschreibung: beschreibung,
            produktbilder: produktbilderDTO,
            file: undefined,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        supplement.beschreibung!.supplement = supplement;
        return supplement;
    }

    #supplementUpdateDtoToSupplement(
        supplementDTO: SupplementUpdateDTO,
    ): Supplement {
        return {
            id: undefined,
            version: undefined,
            name: supplementDTO.name,
            portionen: supplementDTO.portionen,
            supplementArt: supplementDTO.supplementArt,
            beschreibung: undefined,
            produktbilder: undefined,
            file: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
