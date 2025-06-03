import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO-Klasse für Beschreibung ohne TypeORM.
 */
export class BeschreibungDTO {
    @ApiProperty({ example: 'Hochwertiges Eiweißpulver mit Vanillegeschmack.' })
    @IsString()
    @MaxLength(255)
    readonly info!: string;

    @ApiProperty({
        example: 'Fördert den Muskelaufbau und unterstützt die Regeneration.',
    })
    @IsString()
    @MaxLength(255)
    @IsOptional()
    readonly vorteile?: string;

    @ApiProperty({
        example: '1–2 Messlöffel täglich in Wasser oder Milch einrühren.',
    })
    @IsString()
    @MaxLength(255)
    @IsOptional()
    readonly dosierempfehlung?: string;
}
