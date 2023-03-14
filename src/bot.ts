import { randomUUID } from 'crypto';
import { Api, Bot, Context } from "grammy";
import { InputMediaPhoto } from 'grammy/types';

import * as ai from './ai/openai';

// Only members of this group can chat with the bot
const WHITELISTED_GROUP_ID = Number(process.env.TELEGRAM_WHITELISTED_GROUP_ID);

// Whitelisted user can chat with the bot even if they are not member of the whitelisted group
const WHITELISTED_USER_IDS = process.env.TELEGRAM_WHITELISTED_USER_IDS.split(',').map(id => Number(id));

const bot = new Bot(process.env.TELEGRAM_TOKEN as string);
export default bot;

// Handle /chat command
bot.hears(/\/chat (.+)/, async (ctx) => {
  // Check if user has permission to chat with the bot
  if (!checkPermission(ctx, bot.api)) return;

  // Generate randon unique identifier for this request
  const uuid = randomUUID();
  const message = ctx.match[1];
  console.log(`Received chat request: user_id=${ctx.from.id} username=${ctx.from.username} chat_id=${ctx.chat.id} chat_type=${ctx.chat.type} request_uuid=${uuid} message="${message}"`);
  // Pretend that the bot is typing
  ctx.replyWithChatAction('typing');
  // Retrieve response from AI
  const response = await ai.chat(message);
  console.log(`Sending chat response: request_uuid=${uuid} status=${response.status} response=${response.message}`)
  ctx.reply(response.message);
});

// Handle /draw command
bot.hears(/\/draw (.+)/, async (ctx) => {
  // Check if user has permission to chat with the bot
  if (!checkPermission(ctx, bot.api)) return;

  ctx.replyWithChatAction('upload_photo')
  // Generate randon unique identifier for this request
  const uuid = randomUUID();
  const message = ctx.match[1];
  console.log(`Received draw request: user_id=${ctx.from.id} username=${ctx.from.username} chat_id=${ctx.chat.id} chat_type=${ctx.chat.type} request_uuid=${uuid} message="${message}"`);
  // Retrieve images from AI
  const response = await ai.draw(message);
  console.log(`Sending draw response: request_uuid=${uuid} response=${JSON.stringify(response)}`)
  if (response.images?.length > 0) {
    const mediaGroup: InputMediaPhoto[] = response.images.map(url => ({ type: "photo", media: url }));
    ctx.replyWithMediaGroup(mediaGroup);
  } else {
    ctx.reply(response.message || "Unknown Error");
  }
});

// Log unknown messages
bot.on('message', (ctx) => {
  console.warn(`Unknown message: user_id=${ctx.from.id} username=${ctx.from.username} chat_id=${ctx.chat.id} chat_type=${ctx.chat.type} message="${ctx.message.text}"`);
})

/**
 * Check if user has permission to chat with the bot
 *
 * @param ctx message context
 * @param api bot api
 * @returns true if user has permission to chat with the bot
 */
async function checkPermission(ctx: Context, api: Api): Promise<boolean> {
  if (ctx.chat.id == WHITELISTED_GROUP_ID || WHITELISTED_USER_IDS.includes(ctx.from.id)) {
    return true;
  }
  const member = await api.getChatMember(WHITELISTED_GROUP_ID, ctx.from.id);
  const hasPermission = member.status != 'left' && member.status != 'kicked';
  if (!hasPermission) {
    console.error(`Unauthorized access: user_id=${ctx.from.id} username=${ctx.from.username} chat_id=${ctx.chat.id} chat_type=${ctx.chat.type} message="${ctx.message.text}`);
  }
  return hasPermission;
}
