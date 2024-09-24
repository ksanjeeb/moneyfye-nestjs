import { Column, Entity, PrimaryColumn } from "typeorm";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
    @PrimaryColumn('uuid')
    id?: number;
  
    @Column({ type: 'varchar', length: 100 })
    username: string;
  
    @Column({ type: 'varchar' })
    password: string;

    constructor(){
        this.id = uuidv4();
    }
}
