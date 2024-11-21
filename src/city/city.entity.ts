import { Column, DataType, Model, PrimaryKey, Table, Default, HasOne, HasMany } from "sequelize-typescript";
import { User } from '@app/users/user.entity';
import { Event } from '@app/events/events.entity';

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'city' })
export class City extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   name: string;

   @HasOne(() => User)
   user: User;

   @HasMany(() => Event)
   events: Event[];

}