import { Column, DataType, Model, PrimaryKey, Table, Default, BelongsTo, ForeignKey } from "sequelize-typescript";
import { City } from '@app/city/city.entity';
import { User } from '@app/users/user.entity';

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'events' })
export class Event extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   name: string;

   @ForeignKey(() => User)
   @Column({ type: UUID, allowNull: true })
   userId: string;

   @BelongsTo(() => User)
   user: User;


   @ForeignKey(() => City)
   @Column({ type: UUID, allowNull: true })
   cityId: string;

   @BelongsTo(() => City)
   city: City;
}