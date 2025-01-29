import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { CategoryService } from '@app/category/category.service';
import { UsersService } from '@app/users/users.service';

@Injectable()
export class EventsTextGenerator {
   constructor(
      private readonly userService: UsersService,
      private readonly categoryService: CategoryService,
   ) {}

   async genEventText(@Ctx() ctx: Context, title?, fullText?, addIniciator?, admin?) {
      const lang = ctx.session.language || 'ru';
      const t = (uz: string, ru: string) => (lang === 'uz' ? uz : ru);
      const noData = t('кўрсатилмаган', 'не указано');
      const statusText = {
         notPublished: t(`👁‍🗨 Ko'rsatilmagan`, '👁‍🗨 На проверке'),
         published: t(`✅ E'lon qilingan`, '✅ Опубликовано'),
         decline: t(`⛔️ Rad etilgan`, '⛔️ Отклонено'),
      }
      const event = ctx.session.currentEvent;

      if(ctx.session.query === 'addEvent' || !ctx.session.query) {
         ctx.session.currentEvent.title = t(`TADBIR QO‘SHISH`, 'ДОБАВЛЕНИЕ МЕРОПРИЯТИЯ');
      }
      if(ctx.session.query === 'editEvent') {
         ctx.session.currentEvent.title = t(`TADBIRNI TAHRIRLASH`, 'РЕДАКТИРОВАНИЕ МЕРОПРИЯТИЯ');
      }
      if(!event.published) {
         ctx.session.currentEvent.status = statusText.notPublished
      }
      if(event.published) {
         ctx.session.currentEvent.status = statusText.published
      }
      if(event.decline) {
         ctx.session.currentEvent.status = statusText.decline
      }

      if(event.categoryId) {
         const category = await this.categoryService.findById(event.categoryId)
         event.category = category[lang]
      }
      let creator = ctx.session.user
      if(ctx.session.currentEvent.userId) {
         creator = await this.userService.findById(ctx.session.currentEvent.userId)
      }
      title ? ctx.session.currentEvent.title = title : ctx.session.currentEvent.title = ''
      const userContact = `[${creator.name || creator.tgId}](tg://user?id=${creator.tgId})`
      let descriptionText = event.description
      if(!fullText && descriptionText.length > 100) {
         descriptionText = event.description.slice(0, 100) + '...'
      }

      const query = ctx.session.query
      if(query === 'showEventsForDate' || query === 'showCategory' || query === 'showAllEvents') {
         descriptionText = `${process.env.PUBLIC_CHANNEL_URL}/${ctx.session.currentEvent.groupPostId}`
      }
      const fields = [
         { label: t('Nomi', 'Название'), value: event.name },
         { label: t('Tavsif', 'Описание'), value: descriptionText },
         { label: t('Sana', 'Дата'), value: event.fullDateText },
         { label: t('Narxi', 'Стоимость'), value: event.cost },
         { label: t('Kategoriya', 'Категория'), value: event.category || noData },
         { label: t('Aloqa', 'Контакт'), value:  ctx.session.currentEvent.contact || userContact },
         { label: t('Telefon', 'Телефон'), value: event.phone },
      ];
      if(addIniciator || admin) {
         fields.push({ label: t('Tashabbuskor', 'Инициатор'), value: userContact })
      }
      if(ctx.session.query == 'showAllUsersEvents' && title !== 'НОВОЕ МЕРОПРИЯТИЕ НА МОДЕРАЦИИ') {
         fields.push({ label: t('Ҳолат', 'Статус'), value: event.status })
      }
      const text = `${ctx.session.currentEvent.title}\n` + fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');

      return text
   }
}