import { Column, DataType, Model, PrimaryKey, Table, Default, BelongsTo, ForeignKey } from "sequelize-typescript";

import { City } from '@app/city/city.entity';
import { User } from '@app/users/user.entity';
import { Category } from '@app/category/category.entity';

const { UUID, UUIDV4, STRING, INTEGER, TEXT, BOOLEAN } = DataType;

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

   @Column({ type: TEXT, allowNull: false })
   description: string;

   @Column({ type: STRING, allowNull: false })
   cost: string;

   @Column({ type: STRING, allowNull: false })
   phone: string;

   @Column({ type: STRING, allowNull: true })
   contact: string;

   @Column({ type: STRING, allowNull: false })
   selectedYear: number;

   @Column({ type: STRING, allowNull: false })
   selectedMonth: number;

   @Column({ type: STRING, allowNull: true })
   fullDate: string;

   @Column({ type: STRING, allowNull: true })
   dateRawBegin: string;

   @Column({ type: STRING, allowNull: true })
   dateRawEnd: string;

   @Column({ type: STRING, allowNull: false })
   fullDateText: string;

   @Column({ type: BOOLEAN, allowNull: false, defaultValue: false })
   published: boolean;

   @Column({ type: BOOLEAN, allowNull: false, defaultValue: false })
   decline: boolean;

   @Column({ type: INTEGER, allowNull: true })
   groupPostId: number;

   @Column({ type: INTEGER, allowNull: false, defaultValue: 0 })
   likes: number;

   @Column({ type: INTEGER, allowNull: false, defaultValue: 0 })
   dislikes: number;

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