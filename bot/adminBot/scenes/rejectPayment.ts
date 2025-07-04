import { Scenes } from 'telegraf';
import type { BotContext } from '../../../types/BotContext';
import { prisma } from '../../../db';

export const rejectPaymentScene = new Scenes.BaseScene<BotContext>('reject-payment-scene');

rejectPaymentScene.enter(async (ctx) => {
  await ctx.reply('Введите ID платежа, который нужно отклонить:');
});

rejectPaymentScene.on('text', async (ctx) => {
  const id = Number(ctx.message?.text);
  if (!id || isNaN(id)) {
    await ctx.reply('Некорректный ID.');
    return;
  }
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    await ctx.reply('Платёж не найден.');
    return;
  }
  if (payment.status !== 'pending') {
    await ctx.reply('Этот платёж уже был обработан.');
    return;
  }

  await prisma.payment.update({ where: { id }, data: { status: 'rejected' } });
  await ctx.reply(`Платёж #${id} отклонён.`);

  // Оповести пользователя (если нужно)
  if (payment.userId) {
    const user = await prisma.user.findUnique({ where: { id: payment.userId } });
    if (user && user.telegramId) {
      await ctx.telegram.sendMessage(
        user.telegramId.toString(),
        `Ваш платёж #${id} был отклонён администратором. Пожалуйста, уточните детали у поддержки.`
      );
    }
  }
  return ctx.scene.leave();
});
