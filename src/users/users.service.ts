import { Injectable, Inject } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
   constructor(
      @Inject('USERS_REPOSITORY')
      private usersRepository: typeof User
   ) {}

   async findAll(): Promise<User[]> {
      return this.usersRepository.findAll<User>();
   }

   async findByTgId(tgId): Promise<User> {
      let user = await this.usersRepository.findOne<User>({
         where: { tgId: tgId }
      });
      if(!user) {
         user = await this.create({ id: tgId })
      }
      return user
   }

   async create(user): Promise<User> {
      return this.usersRepository.create<User>(
         {
            tgId: user.id,
            name: user?.first_name || null,
         }
      );
   }

   async update(tgId: string, user) {
      return await this.usersRepository.update(user, {
         where: { tgId: tgId }
      })
   }
}
