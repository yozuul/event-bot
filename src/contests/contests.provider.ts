import { Contest } from './contest.entity';

export const contestProviders = [
  {
    provide: 'CONTEST_REPOSITORY',
    useValue: Contest,
  },
];