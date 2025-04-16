import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Beschreibung } from './beschreibung.entity';
import { Produktbild } from './produktbild.entity';


export type supplementArt = 'pulver' | 'tabletten' | 'kapseln'

@Entity()
export class Supplement {
    @PrimaryGeneratedColumn()
    readonly id: number | undefined;

    /*
    @VersionColumn()
    readonly version: number | undefined;
    */

    @Column()
    @ApiProperty({})
    readonly name!: string;

    @Column('varchar')
    @ApiProperty({})
    readonly portionen: number | undefined;

    @Column('varchar')
    @ApiProperty({})
    readonly supplementArt: supplementArt | undefined;

    @OneToOne(() => Beschreibung, (beschreibung) => beschreibung.supplment, {
        cascade: ['insert', 'remove'],
    })
    readonly beschreibung: Beschreibung | undefined;

    @OneToMany(() => Produktbild, (produktbild) => produktbild.supplement, {
        cascade: ['insert', 'remove'],
    })
    readonly produktbilder: Produktbild[] | undefined;

    @CreateDateColumn()
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn()
    readonly aktualisiert: Date | undefined;

}
