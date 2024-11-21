import { Sequelize } from 'sequelize-typescript';

import { User } from '@app/users/user.entity';
import { City } from '@app/city/city.entity';
import { Event } from '@app/events/events.entity';
import { Category } from '@app/category/category.entity';
import { Translation } from '@app/translations/translation.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '',
        database: 'events-bot',
        logging: false
      });
      sequelize.addModels([User, City, Event, Translation, Category]);
      await sequelize.sync();
      return sequelize;
    },
  },
];