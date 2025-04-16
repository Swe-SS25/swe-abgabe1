import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Supplement } from "./supplement.entity";

@Entity()
export class Beschreibung {
    @PrimaryColumn()
    readonly id : number | undefined;

    @Column()
    readonly info : string | undefined;

    @Column()
    readonly vorteile: string | undefined;

    @Column()
    readonly dosieremphehlug: string | undefined;

    @OneToOne(() => Supplement, (supplement) => supplement.beschreibung)
    @JoinColumn({name: 'supplement_id' })
    supplment: Supplement | undefined;

}