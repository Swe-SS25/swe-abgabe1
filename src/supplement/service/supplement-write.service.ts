import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplement } from '../entity/supplement.entity.js';
import { getLogger } from '../../logger/logger.js';
import { InjectRepository } from '@nestjs/typeorm';
import { SupplementReadService } from './supplement-read.service.js';
import { Produktbild } from '../entity/produktbild.entity.js';
import { Beschreibung } from '../entity/beschreibung.entity.js';
import { type DeleteResult, Repository } from 'typeorm';
import {
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';

/** Typdefinitionen zum Aktualisieren eines Supplements mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Supplements. */
    readonly id: number | undefined;
    /** Supplement-Objekt mit den aktualisierten Werten. */
    readonly supplement: Supplement;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};

/**
 * Die Klasse `SupplementWriteService` implementiert den Anwendungskern für das
 * Schreiben von Supplements und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class SupplementWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;
    readonly #logger= getLogger(SupplementWriteService.name);
    readonly #repo: Repository<Supplement>;
    readonly #readService: SupplementReadService;
    
    constructor(
        @InjectRepository(Supplement) repo: Repository<Supplement>,
        readService: SupplementReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    };

    /**
     * Ein neues Supplement soll angelegt werden.
     * @param supplement Das neu abzulegende Supplement
     * @returns Die ID des neu angelegten Supplements
     */
    async create(supplement: Supplement): Promise<any> {
        this.#logger.debug('create: supplement=%o', supplement);

        const supplementDB: any = await this.#repo.save(supplement);

        return supplementDB.id;
    }

    /**
     * Ein vorhandenes Supplement soll aktualisiert werden. "Destructured" Argument
     * mit id (ID des zu aktualisierenden Supplements), Supplement (zu aktualisierendes Supplement)
     * und version (Versionsnummer für optimistische Synchronisation).
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws NotFoundException falls kein Buch zur ID vorhanden ist
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({ id, supplement, version }: UpdateParams) {
        this.#logger.debug(
            'update: id=%d, supplement=%o, version=%s',
            id,
            supplement,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Supplement mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(supplement, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Supplement)) {
            return validateResult;
        }

        const supplementNeu = validateResult;
        const merged = this.#repo.merge(supplementNeu, supplement);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }


    /**
     * Ein Supplement wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const supplement = await this.#readService.findById({
            id,
            mitProduktbildern: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Supplement  zur gegebenen ID mit Beschreibung und Pb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const beschreibungId = supplement.beschreibung?.id;
            if (beschreibungId !== undefined) {
                await transactionalMgr.delete(Beschreibung, beschreibungId);
            }
            // "Nullish Coalescing" ab ES2020
            const produktbilder = supplement.produktbilder ?? [];
            for (const produktbild of produktbilder) {
                await transactionalMgr.delete(Produktbild, produktbild.id);
            }

            deleteResult = await transactionalMgr.delete(Supplement, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateUpdate(
        supplement: Supplement,
        id: number,
        versionStr: string,
    ): Promise<Supplement> {
        this.#logger.debug(
            '#validateUpdate: supplement=%o, id=%s, versionStr=%s',
            supplement,
            id,
            versionStr,
        );
        if (!SupplementWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: supplement=%o, version=%d',
            supplement,
            version,
        );

        const supplementDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = supplementDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: supplementDb=%o', supplementDb);
        return supplementDb;
    }
}