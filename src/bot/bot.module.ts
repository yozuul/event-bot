import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { Redis } from '@telegraf/session/redis';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { UsersModule } from '@app/users/users.module';
import { LanguageScene, ProfileScene, WelcomeScene } from './scenes';
import { CityModule } from '@app/city/city.module';
import { CategoryModule } from '@app/category/category.module';
import { EventsModule } from '@app/events/events.module';
import { LanguageKeyboard } from './keyboards';

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
      UsersModule, CityModule, CategoryModule, EventsModule
   ],
   providers: [BotService, BotUpdate, LanguageScene, WelcomeScene, ProfileScene, LanguageKeyboard],
})
export class BotModule {}