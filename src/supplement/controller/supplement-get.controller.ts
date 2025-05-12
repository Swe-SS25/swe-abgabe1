import { ApiHeader, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { getLogger } from "../../logger/logger.js";
import { Controller, Get, HttpStatus, Param, ParseIntPipe, Req, Res, UseInterceptors, Headers } from "@nestjs/common";
import { paths } from "../../config/paths.js";
import { ResponseTimeInterceptor } from "../../logger/response-time.interceptor.js";
import { SupplementReadService } from "../service/supplement-read.service.js";
import { Public } from "nest-keycloak-connect";
import { Supplement } from "../entity/supplement.entity.js";
import { Request, Response } from 'express';


/**
 * Die Controller-Klasse für die Verwaltung von Supplements.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Supplement REST-API')
export class SupplementGetController {
    readonly #service: SupplementReadService;

    readonly #logger = getLogger(SupplementGetController.name);

    constructor(service: SupplementReadService){
        this.#service = service;
    }

     /**
     * Ein Supplement wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Supplement gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Supplements gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Supplement im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Supplement zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Suche mit der Supplement-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Supplement wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Supplement zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Supplement wurde bereits heruntergeladen',
    })
    async getById(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<Supplement | undefined>>{
        this.#logger.debug('getById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const supplement = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): supplement=%s', supplement.toString());
            this.#logger.debug('getById(): beschreibung=%o', supplement.beschreibung);
        }

        // ETags
        const versionDb = supplement.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        this.#logger.debug('getById: supplement=%o', supplement);
        return res.json(supplement);
    }
}