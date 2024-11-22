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
      calendarMessageId: number
      query: string;
      prevScene: string;
      currentEvent: {
         id: string
         title: string
         name: string
         photo: string
         description: string
         date: string
         cost: string
         category: string
         phone: string
         status: string
         selectedYear: number
         selectedMonth: number
         selectedTime: { hour: number; minute: number; }
         fullDate: string
      }
   }
   scene: {
      enter: (sceneId: string) => void;
      leave: () => void;
      current: () => string | null;
   }
   match?: RegExpExecArray;
}

interface CustomSession extends Scenes.SceneSessionData {
   language: string;
}

export interface BotContext extends Scenes.SceneContext<CustomSession> {
   session: Scenes.SceneSession<CustomSession>;
}