import { Scenes, Markup } from 'telegraf';
import { calculateAdmissionChance } from '../../../utils/admissionCalculator';
export type UserCalculationSession = {
  name?: string;
  phone?: string;
  region?: 'г.Бишкек' | 'малый город' | 'село' | 'высокогорье';
  mainScore?: number;
  chemistryScore?: number;
  biologyScore?: number;
};

const BUDGET_FACULTIES = ['Лечебное дело', 'Педиатрия', 'МПД', 'ВСО'];
const CONTRACT_FACULTIES = ['Лечебное дело', 'Педиатрия', 'МПД', 'ВСО', 'Стоматология', 'Фармация'];

export const calculateScene = new Scenes.WizardScene<Scenes.WizardContext & { session: UserCalculationSession }>(
  'calculate-wizard',
  // 1. Имя
  async (ctx) => {
    await ctx.reply('Введите своё имя (только буквы):');
    return ctx.wizard.next();
  },

  // 2. Имя: валидация
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message) || !/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(ctx.message.text.trim())) {
      await ctx.reply('Имя должно содержать только буквы. Попробуйте ещё раз:');
      return;
    }
    ctx.session.name = ctx.message.text.trim();
    await ctx.reply('Поделитесь номером телефона кнопкой ниже:', Markup.keyboard([
      Markup.button.contactRequest('Поделиться контактом')
    ]).oneTime().resize());
    return ctx.wizard.next();
  },

  // 3. Телефон
  async (ctx) => {
    // Важно: ждём контакт, не text
    if (!ctx.message || !('contact' in ctx.message)) {
      await ctx.reply('Пожалуйста, используйте кнопку для отправки контакта.');
      return;
    }
    ctx.session.phone = ctx.message.contact.phone_number;
    await ctx.reply('Выберите регион проживания:', Markup.keyboard([
      ['г.Бишкек'], ['малый город'], ['село'], ['высокогорье']
    ]).oneTime().resize());
    return ctx.wizard.next();
  },

  // 4. Регион
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message) || !['г.Бишкек', 'малый город', 'село', 'высокогорье'].includes(ctx.message.text)) {
      await ctx.reply('Выберите регион кнопкой.');
      return;
    }
    ctx.session.region = ctx.message.text as UserCalculationSession['region'];
    await ctx.reply('Введите баллы основного теста:');
    return ctx.wizard.next();
  },

  // 5. Баллы: основной тест
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите баллы основного теста числом (0-200):');
      return;
    }
    const score = Number(ctx.message.text);
    if (isNaN(score) || score < 0 || score > 200) {
      await ctx.reply('Некорректное значение. Введите баллы основного теста (0-200):');
      return;
    }
    ctx.session.mainScore = score;
    await ctx.reply('Введите баллы по химии:');
    return ctx.wizard.next();
  },

  // 6. Баллы: химия
  async (ctx) => {
    if (!ctx.message || ctx.message.constructor.name !== 'TextMessage' || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите баллы по химии числом (0-100):');
      return;
    }
    const score = Number(ctx.message.text);
    if (isNaN(score) || score < 0 || score > 100) {
      await ctx.reply('Некорректное значение. Введите баллы по химии (0-100):');
      return;
    }
    ctx.session.chemistryScore = score;
    await ctx.reply('Введите баллы по биологии:');
    return ctx.wizard.next();
  },

  // 7. Баллы: биология + порог
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите баллы по биологии числом (0-100):');
      return;
    }
    const score = Number(ctx.message.text);
    if (isNaN(score) || score < 0 || score > 100) {
      await ctx.reply('Некорректное значение. Введите баллы по биологии (0-100):');
      return;
    }
    ctx.session.biologyScore = score;
    // Проверка пороговых значений
    const { mainScore, chemistryScore, biologyScore } = ctx.session;
    if ((mainScore ?? 0) < 110 || (chemistryScore ?? 0) < 60 || (biologyScore ?? 0) < 60) {
      await ctx.reply('К сожалению, у вас не хватает баллов для расчета шанса. Также вы не можете участвовать в турах для поступления в КГМА. Для консультации по этому вопросу можете написать нашему менеджеру: @proort');
      return ctx.scene.leave();
    }
    // Данные для проверки
    await ctx.reply(
      `Проверьте ваши данные:\n\n` +
      `Имя: ${ctx.session.name}\n` +
      `Телефон: ${ctx.session.phone}\n` +
      `Регион: ${ctx.session.region}\n` +
      `Основной тест: ${mainScore}\n` +
      `Химия: ${chemistryScore}\n` +
      `Биология: ${biologyScore}\n\n` +
      `После оплаты можно будет поменять только факультет и форму обучения.`,
      Markup.keyboard([['Всё верно', 'Исправить']]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  // 8. Подтверждение данных
  async (ctx) => {
    if (ctx.message && 'text' in ctx.message && ctx.message.text === 'Исправить') {
      await ctx.reply('Введите своё имя (только буквы):');
      return ctx.wizard.selectStep(1);
    }
    if (!ctx.message || !('text' in ctx.message) || ctx.message.text !== 'Всё верно') {
      await ctx.reply('Пожалуйста, подтвердите корректность кнопкой.');
      return;
    }
    // Тут происходит переход к сцене оплаты (или обработка внутри этой же сцены)
    await ctx.reply('Для оплаты переведите по этим реквизитам: ...\n*QR-код*', {/* сюда вставить Markup для QR*/});
    await ctx.reply('После оплаты отправьте фото чека.');
    return ctx.wizard.next();
  },

  // 9. Ожидание чека (фото)
  async (ctx) => {
    if (!ctx.message || !('photo' in ctx.message)) {
      await ctx.reply('Пожалуйста, отправьте фотографию чека.');
      return;
    }
    // Отправить чек админу, поставить статус "ожидание подтверждения"
    // ...
    await ctx.reply('Чек отправлен на проверку. Ожидайте подтверждения от администратора.');
    return ctx.scene.leave();
  }
);
