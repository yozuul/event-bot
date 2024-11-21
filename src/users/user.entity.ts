import {
   Column, DataType, Model, PrimaryKey, Table, Default, BelongsToMany, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { City } from '@app/city/city.entity';
import { Event } from '@app/events/events.entity';

const { UUID, UUIDV4, STRING, INTEGER, BIGINT } = DataType;

@Table({ tableName: 'users' })
export class User extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: true })
   name: string;

   @Column({ type: BIGINT, allowNull: false })
   tgId: number;

   @Column({ type: STRING, allowNull: true })
   phone: string;

   @Column({ type: INTEGER, allowNull: true })
   age: number;

   @Column({ type: STRING, allowNull: true })
   avatar: string;

   @Column({ type: STRING, allowNull: false, defaultValue: 'uz' })
   language: string;

   @BelongsToMany(() => Event, 'user_events', 'userId', 'eventId')
   events: Event[];


   @ForeignKey(() => City)
   @Column({ type: UUID, allowNull: true })
   cityId: string;

   @BelongsTo(() => City)
   city: City;
}