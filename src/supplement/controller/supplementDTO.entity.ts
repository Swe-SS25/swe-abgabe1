import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsArray, IsBoolean, IsDateString, IsOptional, MaxLength, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { BeschreibungDTO } from './beschreibungDTO.entity.js';
import { ProduktbildDTO } from './produktbildDTO.entity.js';

export type SupplementArt = 'pulver' | 'tabletten' | 'kapseln';

export class SupplementDtoOhneRef {
    @MaxLength(100)
    @ApiProperty({ example: 'Creatin Monohydrat', type: String })
    readonly name!: string;

    @IsInt()
    @IsOptional()
    @ApiProperty({ example: 60, description: 'Anzahl der Portionen', type: Number })
    readonly portionen!: number;

    @IsIn(['pulver', 'tabletten', 'kapseln'])
    @IsOptional()
    @ApiProperty({ example: 'pulver', enum: ['pulver', 'tabletten', 'kapseln'] })
    readonly supplementArt!: SupplementArt;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true })
    readonly lieferbar?: boolean;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ example: '2025-01-01' })
    readonly verfuegbarAb?: string;
}

export class SupplementDTO extends SupplementDtoOhneRef {
    @ValidateNested()
    @Type(() => BeschreibungDTO)
    @IsOptional()
    @ApiProperty({ type: BeschreibungDTO })
    readonly beschreibung?: BeschreibungDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProduktbildDTO)
    @ApiProperty({ type: [ProduktbildDTO] })
    readonly produktbilder?: ProduktbildDTO[];
}
