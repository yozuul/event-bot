import { Adwersting } from './adwersting.entity';

export const adwerstingProviders = [
  {
    provide: 'ADWERSTING_REPOSITORY',
    useValue: Adwersting,
  },
];
