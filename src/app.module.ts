import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { CityModule } from './city/city.module';
import { EventsModule } from './events/events.module';
import { CategoryModule } from './category/category.module';
import { ContestsModule } from './contests/contests.module';
import { TranslationsModule } from './translations/translations.module';
import { AdwerstingModule } from './adwersting/adwersting.module';

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
      }),
      UsersModule, BotModule, DatabaseModule, CityModule, EventsModule, CategoryModule, ContestsModule, TranslationsModule, AdwerstingModule
   ],
   controllers: [],
   providers: [],
})
export class AppModule {}


