import { Scenes, Markup } from 'telegraf';
import type { BotContext } from '../../../types/BotContext';
import { prisma } from '../../../db';

export const listPaymentsScene = new Scenes.BaseScene<BotContext>('list-payments-scene');

listPaymentsScene.enter(async (ctx) => {
  const pendingPayments = await prisma.payment.findMany({
    where: { status: 'pending' },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!pendingPayments.length) {
    await ctx.reply('Нет неподтверждённых платежей.');
    return ctx.scene.leave();
  }

  for (const payment of pendingPayments) {
    const caption =
      `Платёж #${payment.id}\n` +
      `Имя: ${payment.user?.name || '-'}\n` +
      `Телефон: ${payment.user?.phone || '-'}\n` +
      `Статус: ${payment.status}\n` +
      `Дата: ${payment.createdAt.toLocaleString()}`;
    if (payment.proofPhotoId) {
      await ctx.replyWithPhoto(
        payment.proofPhotoId,
        {
          caption,
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Подтвердить', `approve:${payment.id}`),
              Markup.button.callback('❌ Отклонить', `reject:${payment.id}`),
            ],
          ])
        }
      );
    } else {
      await ctx.reply(
        `${caption}\n\n⚠️ Нет фото подтверждения платежа.`
      );
    }
  }
  // Остаёмся в сцене, ждём действия
});

// ...здесь можно добавить обработку inline-кнопок (approve/reject)
// Но удобнее глобально в adminBot.ts, чтобы все callback_query ловились там.
