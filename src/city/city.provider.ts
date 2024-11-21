import { City } from './city.entity';

export const cityProviders = [
  {
    provide: 'CITY_REPOSITORY',
    useValue: City,
  },
];