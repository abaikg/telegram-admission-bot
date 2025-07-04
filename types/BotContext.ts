import { Context, Scenes } from 'telegraf';

// Описывает состояние любого Wizard FSM-процесса пользователя
export interface WizardState {
  name?: string;
  phone?: string;
  region?: string;
  mainScore?: number;
  chemistryScore?: number;
  biologyScore?: number;
  educationType?: 'budget' | 'contract';
  faculty?: string;
}

// Сессия FSM для Telegraf Scenes
export interface SessionData extends Scenes.WizardSessionData, WizardState {}

// Расширенный тип контекста для Telegraf userBot
export interface BotContext extends Context {
  session: Scenes.WizardSession<SessionData>;
  scene: Scenes.SceneContextScene<BotContext, SessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}
