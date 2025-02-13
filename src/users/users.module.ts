import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { usersProviders } from './users.provider';

@Module({
  providers: [UsersService, ...usersProviders],
  exports: [UsersService, ...usersProviders]
})
export class UsersModule {}
