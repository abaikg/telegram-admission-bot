import { Telegraf, Scenes, session } from 'telegraf';
import type { BotContext } from '../../types/BotContext';

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

bot.command('start', ctx => ctx.scene.enter('register-wizard'));
bot.command('calculate', ctx => ctx.scene.enter('calculate-scene'));


bot.launch();
