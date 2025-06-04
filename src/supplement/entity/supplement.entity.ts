import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { Beschreibung } from './beschreibung.entity.js';
import { Produktbild } from './produktbild.entity.js';
import { SupplementFile } from './supplementFile.entity.js';

export type SupplementArt = 'pulver' | 'tabletten' | 'kapseln';

@Entity()
export class Supplement {
    @PrimaryGeneratedColumn()
    readonly id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({})
    readonly name!: string;

    @Column('varchar')
    @ApiProperty({})
    readonly portionen: number | undefined;

    @Column('varchar')
    @ApiProperty({})
    readonly supplementArt: SupplementArt | undefined;

    @OneToOne(() => Beschreibung, (beschreibung) => beschreibung.supplement, {
        cascade: ['insert', 'remove'],
    })
    readonly beschreibung: Beschreibung | undefined;

    @OneToMany(() => Produktbild, (produktbild) => produktbild.supplement, {
        cascade: ['insert', 'remove'],
    })
    readonly produktbilder: Produktbild[] | undefined;

    @OneToOne(
        () => SupplementFile,
        (supplementFile) => supplementFile.supplement,
        {
            cascade: ['insert', 'remove'],
        },
    )
    readonly file: SupplementFile | undefined;

    @CreateDateColumn()
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn()
    readonly aktualisiert: Date | undefined;
}
