import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MonthHoursWorked {

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
    month?: number;

    @Column({ 
        nullable: false
    })
    year?: number;

    @Column({ 
        type: 'date', 
        default: () => 'CURRENT_DATE'
    })  
    createDate?: string;

    @Column('decimal', {nullable: false})
    hoursWorked?: number;
}