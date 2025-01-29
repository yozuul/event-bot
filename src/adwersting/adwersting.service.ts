import { Inject, Injectable } from '@nestjs/common';
import { Adwersting } from './adwersting.entity';

@Injectable()
export class AdwerstingService {
   constructor(
      @Inject('ADWERSTING_REPOSITORY')
      private adwesrstingRepository: typeof Adwersting,
   ) {}

   async addSenderChatId(adwPostId, senderPostId, userTgId) {
      await this.adwesrstingRepository.create({
            adwPostId: adwPostId, senderPostId: senderPostId, userId: userTgId
         }
      )
   }

   async findSenderChatIdByPostId(adwPostId) {
      return this.adwesrstingRepository.findAll({
         where: { adwPostId: adwPostId }
      })
   }

   async cleaner(adwPostId) {
      await this.adwesrstingRepository.destroy({
         where: {
            adwPostId: adwPostId,
         },
      })
   }
}