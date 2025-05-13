import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsArray, IsBoolean, IsDateString, IsOptional, IsPositive, MaxLength, IsIn, IsInt } from 'class-validator';
import Decimal from 'decimal.js';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import { BeschreibungDTO } from './beschreibungDTO.entity.js';
import { ProduktbildDTO } from './produktbildDTO.entity.js';

export type SupplementArt = 'pulver' | 'tabletten' | 'kapseln';

const toDecimal = ({ value }: { value: Decimal.Value | undefined }) => {
    if (value === undefined) return;
    Decimal.set({ precision: 6 });
    return new Decimal(value);
};

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

    @Transform(toDecimal)
    @IsPositive()
    @ApiProperty({ example: 29.99, type: Number })
    readonly preis!: Decimal;

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
