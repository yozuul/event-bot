import { Column, DataType, Model, PrimaryKey, Table, Default } from 'sequelize-typescript';

const { UUID, UUIDV4, STRING } = DataType;

@Table({ tableName: 'translations' })
export class Translation extends Model {
   @PrimaryKey
   @Default(UUIDV4)
   @Column({ type: UUID, allowNull: false })
   id: string;

   @Column({ type: STRING, allowNull: false })
   entityType: string; // Например, "Category"

   @Column({ type: UUID, allowNull: false })
   entityId: string; // ID категории или другого объекта

   @Column({ type: STRING, allowNull: false })
   languageCode: string; // Например, "en", "ru", "uz"

   @Column({ type: STRING, allowNull: false })
   name: string; // Переведённое название
}