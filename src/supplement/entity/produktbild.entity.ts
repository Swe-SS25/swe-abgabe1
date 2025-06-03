import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplement } from './supplement.entity.js';

@Entity()
export class Produktbild {
    @PrimaryGeneratedColumn()
    readonly id: number | undefined;

    @Column('varchar')
    @ApiProperty({})
    readonly bezeichnung!: string;

    @Column('varchar')
    @ApiProperty({})
    readonly path: String | undefined;

    @ManyToOne(() => Supplement, (supplemet) => supplemet.produktbilder)
    @JoinColumn({ name: 'supplement_id' })
    supplement: Supplement | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            bezeichnung: this.bezeichnung,
            path: this.path,
        });
}
