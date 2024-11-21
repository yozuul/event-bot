import { Column, DataType, Model, PrimaryKey, Table, Default, HasOne, HasMany } from "sequelize-typescript";
import { User } from '@app/users/user.entity';
import { Event } from '@app/events/events.entity';

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'category' })
export class Category extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   nameRu: string;

   @Column({ type: STRING, allowNull: false })
   nameEn: string;
}