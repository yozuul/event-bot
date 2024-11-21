import { Column, DataType, Model, PrimaryKey, Table, Default, BelongsToMany } from "sequelize-typescript";

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'contests' })
export class Contest extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   name: string;
}