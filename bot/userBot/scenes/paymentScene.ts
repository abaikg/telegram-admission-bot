import { Scenes } from 'telegraf';
import { BotContext } from '../../../types/BotContext';
import { prisma } from '../../../db';

export const paymentScene = new Scenes.BaseScene<BotContext>('payment-wait');

paymentScene.enter(async (ctx) => {
  await ctx.reply(
    '🕓 Ожидаем подтверждения оплаты...\nКак только админ проверит ваш чек, вы получите уведомление.'
  );
});

paymentScene.on('message', async (ctx) => {
  // Опционально — любой ввод в сцене просто повторяет напоминание
  await ctx.reply('Платёж пока на проверке. Ожидайте подтверждения.');
});
