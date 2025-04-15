import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiParam,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { Express, Request, Response } from 'express';
import { AuthGuard, Public, Roles } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Produktbild } from '../entity/produktbild.entity.js';
import { type Beschreibung } from '../entity/beschreibung.entity.js';
import { SupplementWriteService } from '../service/supplement-write.service.js';
import { SupplementDTO } from './supplementDTO.entity.js';
import { createBaseUri } from './createBaseUri.js';
import { Supplement } from '../entity/supplement.entity';

const MSG_FORBIDDEN = 'Kein Token mit ausreichender Berechtigung vorhanden';

/**
 * Die Controller-Klasse für die Verwaltung von Supplements.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Supplement REST-API')
@ApiBearerAuth()
export class SupplementWriteController {
    readonly #service: SupplementWriteService;

    readonly #logger = getLogger(SupplementWriteController.name);
    constructor(service: SupplementWriteService) {
        this.#service = service;
    }

    /**
     * Ein neues Supplement wird asynchron angelegt. Das neu anzulegende Supplement ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Supplement abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Titel oder die ISBN-Nummer bereits
     * existieren.
     *
     * @param SupplementDTO JSON-Daten für ein Supplement im Request-Body.
     * @param req: Request-Objekt von Express für den Location-Header.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles({ roles: ['admin', 'user'] })
    @ApiOperation({ summary: 'Ein neues Supplement anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Supplementdaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() SupplementDTO: SupplementDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: SupplementDTO=%o', SupplementDTO);

        const Supplement = this.#supplementDtoToSupplement(SupplementDTO);
        const id = await this.#service.create(Supplement);

        const location = `${createBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    #supplementDtoToSupplement(supplementDTO: SupplementDTO): Supplement {
        //TODO: Implementierung
        const supplement = {
            id: undefined,
            name: supplementDTO.name,
            preis: new Decimal(supplementDTO.preis),
            produktbild: supplementDTO.produktbild as Produktbild,
            beschreibung: supplementDTO.beschreibung as Beschreibung,
        }
        return supplement;
    }
}