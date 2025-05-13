// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { entities } from './entity/entities.js';
import { SupplementWriteService } from './service/supplement-write.service.js';
import { SupplementWriteController } from './controller/supplement-write.controller.js';
import { SupplementReadService } from './service/supplement-read.service.js';
import { SupplementGetController } from './controller/supplement-get.controller.js';
import { QueryBuilder } from './service/query-builder.js';
import { SupplementQueryResolver } from './resolver/supplement-query.resolver.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Supplements.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, TypeOrmModule.forFeature(entities)],
    controllers: [SupplementWriteController, SupplementGetController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        SupplementWriteService,
        SupplementReadService,
        SupplementQueryResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [SupplementWriteService, SupplementReadService],
})
export class SupplementModule {}