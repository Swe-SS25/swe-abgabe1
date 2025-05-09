import { Injectable } from '@nestjs/common';
import { Supplement } from '../entity/supplement.entity.js';
import { getLogger } from '../../logger/logger.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Die Klasse `SupplementWriteService` implementiert den Anwendungskern für das
 * Schreiben von Supplements und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class SupplementWriteService {
    readonly #logger= getLogger(SupplementWriteService.name);
    readonly #repo: Repository<Supplement>;
    
    constructor(@InjectRepository(Supplement) repo: Repository<Supplement>) {
        this.#repo = repo;
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
}