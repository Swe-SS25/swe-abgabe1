import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { getLogger } from '../../logger/logger.js';
import {
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Req,
    Res,
    UseInterceptors,
    Headers,
    Query,
    NotFoundException,
    StreamableFile,
} from '@nestjs/common';
import { paths } from '../../config/paths.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { SupplementReadService } from '../service/supplement-read.service.js';
import { Public } from 'nest-keycloak-connect';
import { Supplement } from '../entity/supplement.entity.js';
import { Request, Response } from 'express';
import { Suchkriterien } from '../service/suchkriterien.js';
import { SupplementArt } from '../entity/supplement.entity.js';
import { createPage } from './page.js';
import { createPageable } from '../service/pageable.js';
import { Readable } from 'stream';

/**
 * Klasse für `BuchGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `BuchController` hat dieselben Properties wie die Basisklasse
 * `Buch` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class SupplementQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly name?: string;

    /** Darreichungsform: pulver | tabletten | kapseln */
    @ApiProperty({ required: false, enum: ['pulver', 'tabletten', 'kapseln'] })
    declare readonly supplementArt?: SupplementArt;

    @ApiProperty({ required: false, description: 'Anzahl der Portionen' })
    declare readonly portionen?: string;

    @ApiProperty({ required: false })
    declare readonly beschreibung?: string;

    @ApiProperty({ required: false })
    declare size?: string;

    @ApiProperty({ required: false })
    declare page?: string;
}

/**
 * Die Controller-Klasse für die Verwaltung von Supplements.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Supplement REST-API')
export class SupplementGetController {
    readonly #service: SupplementReadService;

    readonly #logger = getLogger(SupplementGetController.name);

    constructor(service: SupplementReadService) {
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
    ): Promise<Response<Supplement | undefined>> {
        this.#logger.debug('getById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const supplement = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'getById(): supplement=%s',
                supplement.toString(),
            );
            this.#logger.debug(
                'getById(): beschreibung=%o',
                supplement.beschreibung,
            );
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

    /**
     * Supplements werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Supplement gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Supplements, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Supplement zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Supplements ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Supplements' })
    async get(
        @Query() query: SupplementQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<Supplement[] | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const { page, size } = query;
        delete query['page'];
        delete query['size'];
        this.#logger.debug('get: page=%s, size=%s', page, size);

        const keys = Object.keys(query) as (keyof SupplementQuery)[];
        keys.forEach((key) => {
            if (query[key] === undefined) {
                delete query[key];
            }
        });
        this.#logger.debug('get: query=%o', query);

        const pageable = createPageable({ number: page, size });
        const supplementSlice = await this.#service.find(query, pageable);
        const supplementPage = createPage(supplementSlice, pageable);
        this.#logger.debug('get: supplementPage=%o', supplementPage);

        return res.json(supplementPage).send();
    }

    @Get('/file/:id')
    @Public()
    @ApiOperation({ description: 'Suche nach Datei mit der Supplement-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiNotFoundResponse({
        description: 'Keine Datei zur Supplement-ID gefunden',
    })
    @ApiOkResponse({ description: 'Die Datei wurde gefunden' })
    async getFileById(
        @Param('id') idStr: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        this.#logger.debug('getFileById: supplementId:%s', idStr);

        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(
                `Die Supplement-ID ${idStr} ist ungueltig.`,
            );
        }

        const supplementFile = await this.#service.findFileBySupplementId(id);
        if (supplementFile?.data === undefined) {
            throw new NotFoundException('Keine Datei gefunden.');
        }

        const stream = Readable.from(supplementFile.data);
        res.contentType(supplementFile.mimetype ?? 'image/png').set({
            'Content-Disposition': `inline; filename="${supplementFile.filename}"`, // eslint-disable-line @typescript-eslint/naming-convention
        });

        return new StreamableFile(stream);
    }
}
