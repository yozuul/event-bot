import { Column, DataType, Model, PrimaryKey, Table, Default, HasOne } from "sequelize-typescript";

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'categories' })
export class Category extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   ru: string;

   @Column({ type: STRING, allowNull: false })
   uz: string;

   // @HasOne(() => Translation, { foreignKey: 'entityId', constraints: false })
   // translation: Translation;
}
