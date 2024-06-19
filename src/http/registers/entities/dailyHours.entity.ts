import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class DailysHoursWorked {

    @PrimaryGeneratedColumn({ unsigned: true })
    id?: number;

    @Column({ 
        unsigned: true,
        nullable: false
     })
    idUser?: number;

    @Column({ 
        nullable: false
    })
    day?: string;

    @Column({ 
        type: 'date', 
        default: () => 'CURRENT_DATE'
    })
    date?: string;

    @Column('decimal', {nullable: false})
    hoursWorked?: number;

}