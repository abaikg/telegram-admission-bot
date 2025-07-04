import { Scenes, Markup } from 'telegraf';
import { prisma } from '../../../db';
import type { BotContext } from '../../../types/BotContext';
import { calculateAdmissionChance } from '../../../utils/admissionCalculator';

const BUDGET_FACULTIES = [
  'Лечебное дело',
  'Педиатрия',
  'МПД',
  'ВСО',
];
const CONTRACT_FACULTIES = [
  'Лечебное дело',
  'Педиатрия',
  'МПД',
  'ВСО',
  'Стоматология',
  'Фармация',
];

export const calculateScene = new Scenes.WizardScene<BotContext>(
  'calculate-wizard',
  async ctx => {
    await ctx.reply(
      'Выберите формат обучения:',
      Markup.keyboard([['Бюджет', 'Контракт']]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, выберите формат кнопкой.');
      return;
    }
    const text = ctx.message.text.toLowerCase();
    if (text !== 'бюджет' && text !== 'контракт') {
      await ctx.reply('Пожалуйста, выберите формат кнопкой.');
      return;
    }
    ctx.session.educationType = text === 'бюджет' ? 'budget' : 'contract';
    const faculties =
      ctx.session.educationType === 'budget'
        ? BUDGET_FACULTIES
        : CONTRACT_FACULTIES;
    await ctx.reply(
      'Выберите факультет:',
      Markup.keyboard(faculties.map(f => [f])).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Выберите факультет кнопкой.');
      return;
    }
    const faculty = ctx.message.text;
    const allowed =
      ctx.session.educationType === 'budget'
        ? BUDGET_FACULTIES
        : CONTRACT_FACULTIES;
    if (!allowed.includes(faculty)) {
      await ctx.reply('Выберите факультет кнопкой.');
      return;
    }
    ctx.session.faculty = faculty;
    await ctx.reply(
      'Нажмите «Рассчитать» для получения результата.',
      Markup.keyboard([['Рассчитать']]).oneTime().resize()
    );
    return ctx.wizard.next();
  },

  async ctx => {
    if (!ctx.message || !('text' in ctx.message) || ctx.message.text !== 'Рассчитать') {
      await ctx.reply('Нажмите «Рассчитать» для получения результата.');
      return;
    }
    if (!ctx.from) {
      await ctx.reply('Ошибка определения пользователя.');
      return ctx.scene.leave();
    }
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from.id) },
    });
    if (!user) {
      await ctx.reply('Пользователь не найден.');
      return ctx.scene.leave();
    }

    const totalScore =
      (user.mainScore ?? 0) + (user.chemistryScore ?? 0) + (user.biologyScore ?? 0);

    const result = calculateAdmissionChance({
      faculty: ctx.session.faculty!,
      educationType: ctx.session.educationType!,
      region: user.region ?? undefined,
      userScore: totalScore,
      tour: 1,
    });

    await prisma.calculation.create({
      data: {
        userId: user.id,
        educationType: ctx.session.educationType!,
        faculty: ctx.session.faculty!,
        mainScore: user.mainScore ?? 0,
        chemistryScore: user.chemistryScore ?? 0,
        biologyScore: user.biologyScore ?? 0,
        probability: result.chancePercentage,
        region: user.region ?? undefined,
      },
    });

    await ctx.reply(
      `📊 Результаты:\n` +
        `Факультет: ${ctx.session.faculty}\n` +
        `Формат: ${ctx.session.educationType === 'budget' ? 'бюджет' : 'контракт'}\n` +
        `Сумма баллов: ${totalScore}\n` +
        `Вероятность (1-й тур): ${result.chancePercentage}%`
    );

    return ctx.scene.leave();
  }
);
