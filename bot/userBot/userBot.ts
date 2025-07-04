import { Telegraf, Scenes, session } from 'telegraf';
import type { BotContext } from '../../types/BotContext';
import { prisma } from '../../db';

import { registerScene } from './scenes/registerScene';
import { paymentScene } from './scenes/paymentScene';
import { calculateScene } from './scenes/calculateScene';

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

bot.use(session());
const stage = new Scenes.Stage<BotContext>([
  registerScene,
  paymentScene,
  calculateScene,
]);
bot.use(stage.middleware());

bot.command('start', async ctx => {
  if (!ctx.from) return;
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from.id) }
  });
  if (user?.hasAccess) {
    await ctx.reply('У вас уже есть доступ. Используйте /calculate для расчёта шансов.');
    return;
  }
  await ctx.scene.enter('register-wizard');
});

bot.command('calculate', async ctx => {
  if (!ctx.from) return;
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from.id) }
  });
  if (!user || !user.hasAccess) {
    await ctx.reply('У вас нет активированного доступа. Пройдите регистрацию через /start.');
    return;
  }
  await ctx.scene.enter('calculate-wizard');
});


bot.launch();
