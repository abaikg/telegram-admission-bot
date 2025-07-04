import { Scenes } from 'telegraf';
import { prisma } from '../../../db';

export const approvePaymentScene = new Scenes.BaseScene('approve-payment');

approvePaymentScene.enter(async (ctx) => {
  // Получаем все неподтверждённые платежи
  const payments = await prisma.payment.findMany({
    where: { status: 'pending' },
    include: { user: true }
  });
  if (payments.length === 0) {
    await ctx.reply('Нет новых платежей для проверки.');
    return (ctx as Scenes.SceneContext).scene.leave();
  }

  // Для каждого платежа — отправляем инфу и кнопки
  for (const payment of payments) {
    await ctx.replyWithPhoto(payment.proofPhotoId, {
      caption: 
        `Пользователь: ${payment.user.name}\n` +
        `Телефон: ${payment.user.phone}\n` +
        `ID: ${payment.user.telegramId}\n` +
        `\nСтатус: ${payment.status}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `approve:${payment.id}` },
            { text: '❌ Отклонить', callback_data: `reject:${payment.id}` }
          ]
        ]
      }
    });
  }
});

// Обработка кнопок
approvePaymentScene.action(/^approve:(\d+)$/, async (ctx) => {
  const paymentId = Number(ctx.match[1]);
  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'confirmed' } });

  // Активируем доступ
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
  if (payment) {
    await prisma.user.update({ where: { id: payment.userId }, data: { hasAccess: true } });
    await ctx.telegram.sendMessage(
      payment.user.telegramId.toString(),
      '✅ Ваш платёж подтверждён! Теперь доступ открыт, используйте /calculate для расчёта шансов.'
    );
  }

  await ctx.reply('Платёж подтверждён!');
  await ctx.answerCbQuery();
});

approvePaymentScene.action(/^reject:(\d+)$/, async (ctx) => {
  const paymentId = Number(ctx.match[1]);
  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'rejected' } });
  // Можно отправить уведомление пользователю
  await ctx.reply('Платёж отклонён.');
  await ctx.answerCbQuery();
});
