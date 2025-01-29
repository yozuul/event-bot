import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { City } from './city.entity';
import { TranslationsService } from '@app/translations/translations.service';

@Injectable()
export class CityService {
   constructor(
      @Inject('CITY_REPOSITORY')
      private readonly cityRepository: typeof City,
      private readonly translateService: TranslationsService
   ) {}

   async create(cityName) {

   }
   async findAll(): Promise<City[]> {
      return this.cityRepository.findAll<City>();
   }
   // async onModuleInit() {
   //    const existCities = await this.findAll()
   //    if(existCities.length === 0) {
   //       const newCity = await this.cityRepository.create({
   //          name: 'Ташкент'
   //       })
   //       await this.translateService.create({
   //          entityType: 'city',
   //          entityId: newCity.id,
   //          languageCode: 'uz',
   //          name: newCity.name
   //       })
   //    }
   // }
}
