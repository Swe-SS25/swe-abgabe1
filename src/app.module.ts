/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { type ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { DevModule } from './config/dev/dev.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { graphQlModuleOptions } from './config/graphql.js';
import { typeOrmModuleOptions } from './config/typeormOptions.js';
import { SupplementModule } from './supplement/supplement.module.js';
import { SupplementWriteController } from './supplement/controller/supplement-write.controller.js';
import { SupplementGetController } from './supplement/controller/supplement-get.controller.js';

@Module({
    imports: [
        DevModule,
        SupplementModule,
        GraphQLModule.forRoot<ApolloDriverConfig>(graphQlModuleOptions),
        LoggerModule,
        TypeOrmModule.forRoot(typeOrmModuleOptions),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes(
                SupplementWriteController,
                SupplementGetController,
                'auth',
                'graphql',
            );
    }
}
