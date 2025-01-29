import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { Redis } from '@telegraf/session/redis';

import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { UsersModule } from '@app/users/users.module';
import { CityModule } from '@app/city/city.module';
import { CategoryModule } from '@app/category/category.module';
import { EventsModule } from '@app/events/events.module';
import { AdwerstingModule } from '@app/adwersting/adwersting.module';
import { EventsKeyboard, EventsTextGenerator } from './keyboards';
import { CalendarService, TimeSelectionService } from './date-services';
import { AdwerstingService } from '@app/adwersting/adwersting.service';
import {
   EventCreateScene, EventsScene, SettingsScene, ProfileScene, WelcomeScene, EventsCategoryScene
} from './scenes';
import { AdwerstingActions, EventsCreateActions, EventsListActions} from './actions';

@Module({
   imports: [
      TelegrafModule.forRootAsync({
         useFactory: async (configService: ConfigService) => {
            const store = Redis({
               url: configService.get<string>('REDIS_URL'),
            });
            return {
               token: configService.get<string>('BOT_TOKEN'),
               middlewares: [
                  session({ store })
               ],
            };
         },
         inject: [ConfigService],
      }),
      UsersModule, CityModule, CategoryModule, EventsModule, AdwerstingModule
   ],
   providers: [
      BotService, BotUpdate, CalendarService, TimeSelectionService,
      SettingsScene, WelcomeScene, ProfileScene, EventsScene, EventCreateScene, EventsCategoryScene,
      EventsKeyboard, EventsCreateActions, EventsTextGenerator, EventsListActions, AdwerstingActions, AdwerstingService
   ],
   exports: [EventCreateScene, EventsCreateActions],
})
export class BotModule {}


