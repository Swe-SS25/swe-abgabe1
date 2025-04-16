import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { Supplement } from "./supplement.entity";

@Entity()
export class Produktbild{
    @PrimaryColumn()
    readonly id: number | undefined;

    @Column()
    @ApiProperty({})
    readonly bezeichnung!: string

    @Column()
    @ApiProperty({})
    readonly path: String | undefined;

    @ManyToOne(() => Supplement, (supplemet) => supplemet.produktbilder)
    @JoinColumn({ name: 'supplement_id'})
    supplement: Supplement | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            bezeichnung: this.bezeichnung,
            path: this.path
        })

}