/*import { Args, extend, Mutation, Resolver } from "@nestjs/graphql";
import { SupplementDTO } from "../controller/supplementDTO.entity";
import { IsInt, IsNumberString } from "class-validator";
import { UseFilters, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard, Roles } from "nest-keycloak-connect";
import { HttpExceptionFilter } from "./http-exception.filter";
import { ResponseTimeInterceptor } from "../../logger/response-time.interceptor";
import { SupplementWriteService } from "../service/supplement-write.service";
import { getLogger } from "../../logger/logger";
import { Supplement } from "../entity/supplement.entity";
import { Beschreibung } from "../entity/beschreibung.entity";

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class SupplementUpdateDTO extend SupplementDTO {
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
    @Roles({ roles: ['admin', 'user']})
    async creat(@Args('input') supplementDTO: SupplementDTO) {
        this.#logger.debug('creat: supplementDTO= %o', supplementDTO);

        const supplement = this.#supplementDtoToSupplement(supplementDTO);
        this.#logger.debug('creat: supplement= %o', supplement);
        const createdSupplement = await this.#service.create(supplement);
    
    }

    #supplementDtoToSupplement(supplementDTO: SupplementDTO): Supplement{
        const beschreibungDTO = supplementDTO.beschreibung;
        const beschreibung: Beschreibung = {
            id: undefined,
            info: beschreibungDTO.info
            dosierempfehlung: beschreibungDTO.dosierempfehlung,
            
        }
    }
}*/