import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../../../types/BotContext';
import { prisma } from '../../../db';

const QR_IMAGE_FILE_ID = ''; // ⚠️ замени на своё фото QR

type RegisterWizardState = {
  name?: string;
  phone?: string;
  region?: string;
  mainScore?: number;
  chemistryScore?: number;
  biologyScore?: number;
};

export const registerScene = new Scenes.WizardScene<Scenes.WizardContext & { wizard: { state: RegisterWizardState } }>(
      'register-wizard',

  // 1️⃣ Приветствие и ФИО
  async (ctx) => {
    await ctx.reply(
      '👋 Привет! Давай начнём регистрацию.\n\n' +
      '✏️ Введи своё полное имя (только буквы):'
    );
    return ctx.wizard.next();
  },

  // 2️⃣ Проверка ФИО
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Пожалуйста, введи имя текстом.');
      return;
    }
    const name = ctx.message.text.trim();
    if (!/^[А-Яа-яA-Za-z\s]{3,100}$/.test(name)) {
      await ctx.reply('❗️ Имя должно содержать только буквы и быть от 3 до 100 символов.');
      return;
    }
    ctx.wizard.state.name = name;
    await ctx.reply(
      '📞 Поделись своим номером через кнопку ниже:',
      Markup.keyboard([
        Markup.button.contactRequest('📲 Поделиться контактом')
      ]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  // 3️⃣ Телефон
  async (ctx) => {
    if (!ctx.message || !('contact' in ctx.message)) {
      await ctx.reply('❗️ Нужно именно поделиться контактом через кнопку!');
      return;
    }
    ctx.wizard.state.phone = ctx.message.contact.phone_number;
    await ctx.reply(
      '🌍 Выбери свой регион:',
      Markup.keyboard([
        ['г.Бишкек'], ['Малый город'], ['Село'], ['Высокогорье']
      ]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  // 4️⃣ Регион
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Выбери регион кнопкой.');
      return;
    }
    ctx.wizard.state.region = ctx.message.text;
    await ctx.reply('✏️ Введи баллы за основной тест (0–240):');
    return ctx.wizard.next();
  },

  // 5️⃣ Основной тест
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Пожалуйста, введи баллы текстом.');
      return;
    }
    const score = parseInt(ctx.message.text, 10);
    if (isNaN(score) || score < 0 || score > 240) {
      await ctx.reply('❗️ Введи число от 0 до 240.');
      return;
    }
    ctx.wizard.state.mainScore = score;
    await ctx.reply('🧪 Введи баллы по химии (0–140):');
    return ctx.wizard.next();
  },

  // 6️⃣ Химия
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Пожалуйста, введи баллы текстом.');
      return;
    }
    const score = parseInt(ctx.message.text, 10);
    if (isNaN(score) || score < 0 || score > 140) {
      await ctx.reply('❗️ Введи число от 0 до 140.');
      return;
    }
    ctx.wizard.state.chemistryScore = score;
    await ctx.reply('🧬 Введи баллы по биологии (0–140):');
    return ctx.wizard.next();
  },

  // 7️⃣ Биология и проверка порогов
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Пожалуйста, введи баллы текстом.');
      return;
    }
    const score = parseInt(ctx.message.text, 10);
    if (isNaN(score) || score < 0 || score > 140) {
      await ctx.reply('❗️ Введи число от 0 до 140.');
      return;
    }
    ctx.wizard.state.biologyScore = score;

    // Пороговые проверки
    if (
      typeof ctx.wizard.state.mainScore !== 'number' || ctx.wizard.state.mainScore < 110 ||
      typeof ctx.wizard.state.chemistryScore !== 'number' || ctx.wizard.state.chemistryScore < 60 ||
      typeof ctx.wizard.state.biologyScore !== 'number' || ctx.wizard.state.biologyScore < 60
    ) {
      await ctx.reply(
        '⚠️ К сожалению, у вас не хватает баллов для расчёта шанса.\n' +
        'Также вы не можете участвовать в турах для поступления в КГМА.\n\n' +
        'Для консультации напишите нашему менеджеру: @proort'
      );
      return ctx.scene.leave();
    }

    // Подтверждение
    await ctx.reply(
      `✅ Проверь данные:\n\n` +
      `👤 Имя: ${ctx.wizard.state.name}\n` +
      `📞 Телефон: ${ctx.wizard.state.phone}\n` +
      `🌍 Регион: ${ctx.wizard.state.region}\n` +
      `📝 Основной тест: ${ctx.wizard.state.mainScore}\n` +
      `🧪 Химия: ${ctx.wizard.state.chemistryScore}\n` +
      `🧬 Биология: ${ctx.wizard.state.biologyScore}\n\n` +
      `❗️ После оплаты можно будет изменить только факультет и форму обучения.`,
      Markup.keyboard([['✅ Подтвердить', '🔄 Изменить']]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  // 8️⃣ Подтверждение
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❗️ Выбери действие кнопкой.');
      return;
    }
    const text = ctx.message.text.toLowerCase();
    if (text.includes('изменить')) {
      await ctx.reply('🔄 Хорошо! Давай начнём заново. Введи своё имя:');
      return ctx.wizard.selectStep(1);
    }
    if (!text.includes('подтвердить')) {
      await ctx.reply('❗️ Нажми "✅ Подтвердить" или "🔄 Изменить".');
      return;
    }

    // Реквизиты
    await ctx.replyWithPhoto(QR_IMAGE_FILE_ID, {
      caption: '💰 Для оплаты переведите по этим реквизитам.\nПосле оплаты отправьте сюда фото чека.'
    });
    return ctx.wizard.next();
  },

  // 9️⃣ Ждём фото чека
  async (ctx) => {
    if (!ctx.message || !('photo' in ctx.message)) {
      await ctx.reply('❗️ Пожалуйста, отправь фото чека.');
      return;
    }

    const fileId = ctx.message.photo.slice(-1)[0].file_id;

    // Проверяем, что ctx.from определён
    if (!ctx.from) {
      await ctx.reply('❗️ Произошла ошибка: не удалось определить пользователя Telegram.');
      return ctx.scene.leave();
    }

    // Сохраняем в БД
    await prisma.payment.create({
      data: {
        user: {
          connectOrCreate: {
            where: { telegramId: BigInt(ctx.from.id) },
            create: {
              telegramId: BigInt(ctx.from.id),
              name: ctx.wizard.state.name,
              phone: ctx.wizard.state.phone,
              region: ctx.wizard.state.region,
              mainScore: ctx.wizard.state.mainScore,
              chemistryScore: ctx.wizard.state.chemistryScore,
              biologyScore: ctx.wizard.state.biologyScore,
              hasAccess: false
            }
          }
        },
        status: 'pending',
        proofPhotoId: fileId
      }
    });

    await ctx.reply('✅ Спасибо! Ваш чек отправлен на проверку. Мы свяжемся с вами после подтверждения.');

    // Уведомление админу
    if (process.env.ADMIN_CHAT_ID) {
      await ctx.telegram.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `💰 Новый платёж от ${ctx.wizard.state.name}.\n` +
        `Телефон: ${ctx.wizard.state.phone}\n` +
        `Проверьте фото и подтвердите/отклоните в админ-боте.`
      );
    }

    return ctx.scene.leave();
  }
);
