import { Context as ContextTelegraf } from 'telegraf';
import { Scenes } from 'telegraf';

export interface Context extends ContextTelegraf {
   startPayload: any
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
         admin: boolean
      }
      messageIdToEdit: number
      messageToDelete: number[];
      calendarMessageId: number
      query: string;
      prevScene: string;
      showCategory: string;
      currentEvent: {
         id?: any
         name?: string
         photo?: string
         description?: string
         cost?: string
         phone?: string
         eventId?: string
         userId?: string
         title?: string
         date?: string
         category?: any
         categoryId?: string
         published?: boolean
         decline?: boolean
         status?: string
         selectedYear?: number
         selectedMonth?: number
         selectedTime?: { hour: number; minute: number; }
         fullDate?: string
         fullDateText?: string
         cityId?: any
      }
      eventNavigation: {
         allEvents: string[]
         current: string
         totalCount: string | number
      }
      editCategory: {
         uz: string
         ru: string
         id: string | null
      }
      checkboxes:  {
         public_to_group: boolean,
         public_to_bot: boolean
      };
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