import { Context as ContextTelegraf } from 'telegraf';
import { Scenes } from 'telegraf';

export interface Context extends ContextTelegraf {
   session: {
      scene: string
      profileStep: string
      language: string;
      awaitingInput: string | null;
      user: {
         id: string;
         name: string
         tgId: number
         phone: string
         age: number
         avatar: string
         language: string
      }
      messageIdToEdit: number
      messageToDelete: number[];
      currentEvent: {}
      query: string;
      prevScene: string;
   }
   scene: {
      enter: (sceneId: string) => void;
      leave: () => void;
      current: () => string | null;
   }
}

interface CustomSession extends Scenes.SceneSessionData {
   language: string;
}

export interface BotContext extends Scenes.SceneContext<CustomSession> {
   session: Scenes.SceneSession<CustomSession>;
}