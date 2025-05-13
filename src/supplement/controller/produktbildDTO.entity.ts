import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO-Klasse für Produktbild ohne TypeORM.
 */
export class ProduktbildDTO {
    @ApiProperty({ example: 'Frontansicht' })
    @IsString()
    @MaxLength(100)
    readonly bezeichnung!: string;

    @ApiProperty({ example: '/images/supplement1.png' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    readonly path?: string;
}
