import { Inject, Injectable } from '@nestjs/common';
import { Translation } from './translation.entity';
import { CreateTranslationDto } from './translations.dto';

@Injectable()
export class TranslationsService {
   @Inject('TRANSLATION_REPOSITORY')
   private readonly translateRepository: typeof Translation

   async create(data: CreateTranslationDto) {
      return this.translateRepository.create({
         entityType: data.entityType,
         entityId: data.entityId,
         languageCode: data.languageCode,
         name: data.name,
      })
   }
}
