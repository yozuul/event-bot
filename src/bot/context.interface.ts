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
      showEventsForDate: any
      currentEvent: {
         id?: any
         name?: string
         photo?: string
         description?: string
         cost?: string
         phone?: string
         contact?: string
         eventId?: string
         userId?: string
         title?: string
         date?: string
         category?: any
         categoryId?: string
         published?: boolean
         decline?: boolean
         groupPostId?: number
         status?: string
         selectedYear?: number
         selectedMonth?: number
         selectedTime?: { hour: number; minute: number; }
         fullDate?: string
         fullDateText?: string
         cityId?: any

         dateRawBegin?: string
         dateRawEnd?: string
         msgRawEndId?: number
      }
      eventNavigation: {
         allEvents: string[]
         current: string
         totalCount: string | number
         firstSlide?: boolean
         newIndex?: any
      }
      editCategory: {
         uz: string
         ru: string
         id: string | null
      }
      checkboxes:  any;
      likes: any
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