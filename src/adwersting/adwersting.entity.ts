import { Column, DataType, Model, PrimaryKey, Table, Default } from "sequelize-typescript";

const { UUID, UUIDV4, INTEGER, BIGINT } = DataType;

@Table({ tableName: 'adwesrting' })
export class Adwersting extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: INTEGER, allowNull: false })
   adwPostId: number;

   @Column({ type: INTEGER, allowNull: false })
   senderPostId: number;

   @Column({ type: BIGINT, allowNull: false })
   userId: number;
}