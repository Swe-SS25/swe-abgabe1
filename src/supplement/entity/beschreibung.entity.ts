import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Supplement } from "./supplement.entity.js";

@Entity()
export class Beschreibung {
    @PrimaryGeneratedColumn()
    readonly id : number | undefined;

    @Column('varchar')
    readonly info : string | undefined;

    @Column('varchar')
    readonly vorteile: string | undefined;

    @Column('varchar')
    readonly dosieremphehlug: string | undefined;

    @OneToOne(() => Supplement, (supplement) => supplement.beschreibung)
    @JoinColumn({name: 'supplement_id' })
    supplment: Supplement | undefined;

}