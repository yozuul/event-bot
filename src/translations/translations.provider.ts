import { Translation } from './translation.entity';

export const translationProviders = [
  {
    provide: 'TRANSLATION_REPOSITORY',
    useValue: Translation,
  },
];