import { Telegraf, Scenes, session } from 'telegraf';
import type { BotContext } from '../../types/BotContext';

import { listPaymentsScene } from './scenes/listPayments';
import { approvePaymentScene } from './scenes/approvePayment';
import { rejectPaymentScene } from './scenes/rejectPayment';

const adminBot = new Telegraf<BotContext>(process.env.ADMIN_BOT_TOKEN!);

adminBot.use(session());
const stage = new Scenes.Stage<BotContext>([
  listPaymentsScene,
  approvePaymentScene,
  rejectPaymentScene,
]);
adminBot.use(stage.middleware());

adminBot.command('payments', ctx => ctx.scene.enter('list-payments-scene'));

// ...и другие админ-команды

adminBot.launch();
