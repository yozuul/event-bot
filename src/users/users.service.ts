import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { User } from './user.entity';
import { Event } from '@app/events/events.entity';

@Injectable()
export class UsersService implements OnModuleInit {
   constructor(
      @Inject('USERS_REPOSITORY')
      private usersRepository: typeof User
   ) {}

   async findAll(): Promise<User[]> {
      return this.usersRepository.findAll<User>();
   }
   async findById(id): Promise<User> {
      return this.usersRepository.findOne<User>({
         where: { id }
      });
   }

   async findByTgId(tgId): Promise<User> {
      const dateAttr = ['createdAt', 'updatedAt']
      let user = await this.usersRepository.findOne<User>({
         where: { tgId: tgId },
         attributes: { exclude: dateAttr },
         include: [
            {
               model: Event,
               attributes: { exclude: dateAttr },
               through: { attributes: [] },
            }
         ],
      });
      if(!user) {
         user = await this.usersRepository.create({ tgId: tgId })
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

   async update(tgId: number, user) {
      return await this.usersRepository.update(user, {
         where: { tgId: tgId }
      })
   }

   async disableAdminRights() {
      const users = await this.usersRepository.findAll({
         where: { admin: true }
      })
      if(users.length > 0) {
         for (let user of users) {
            if(user.tgId !== 1884297416 && user.tgId !== 47202732) {
               user.admin = false
               await user.save()
            }
         }
      }
   }

   async onModuleInit() {
       const user = await this.findByTgId(1884297416)
       if(!user.admin) {
         user.admin = true
         await user.save()
       }
   }
}


