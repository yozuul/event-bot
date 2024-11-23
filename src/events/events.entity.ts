import { Column, DataType, Model, PrimaryKey, Table, Default, BelongsTo, ForeignKey } from "sequelize-typescript";

import { City } from '@app/city/city.entity';
import { User } from '@app/users/user.entity';
import { Category } from '@app/category/category.entity';

const { UUID, UUIDV4, STRING, BOOLEAN } = DataType;

@Table({ tableName: 'events' })
export class Event extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   name: string;

   @Column({ type: STRING, allowNull: true })
   photo: string;

   @Column({ type: STRING, allowNull: false })
   description: string;

   @Column({ type: STRING, allowNull: false })
   selectedYear: number;

   @Column({ type: STRING, allowNull: false })
   selectedMonth: number;

   @Column({ type: STRING, allowNull: false })
   fullDate: string;

   @Column({ type: STRING, allowNull: false })
   fullDateText: string;

   @Column({ type: BOOLEAN, allowNull: false, defaultValue: false })
   published: boolean;

   @ForeignKey(() => Category)
   @Column({ type: UUID, allowNull: true })
   categoryId: string;

   @BelongsTo(() => Category)
   category: Category;

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