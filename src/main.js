import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import {ogg} from "./ogg.js";
import { openai } from "./openai.js";
import { removeFile } from "./utils.js";

console.log(config.get("TEST_ENV"));

const INITIAL_SESSION = {
    messages: [],
} 

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command('new', async(ctx)=>{
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Жду вашего голосового или текстового сообщения');
})

bot.command('start', async(ctx)=>{
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Жду вашего голосового или текстового сообщения');
})

bot.on(message('voice'), async (ctx)=>{
    ctx.session = INITIAL_SESSION;
    try {
        await ctx.reply(code("Сообщение принял. Жду ответ от сервера..."));
         const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
         //console.log("link :",link.href);
         const userId = String(ctx.message.from.id);
         const oggPath = await ogg.create(link.href, userId);
         const mp3Path = await ogg.toMp3(oggPath, userId);
         removeFile(oggPath);
         //await ctx.reply(JSON.stringify(link, null, 2));
        //await ctx.reply(mp3Path);
         const text = await openai.transcription(mp3Path);
         //await ctx.reply(text);
         await ctx.reply(code(`Ваше сообщение : ${text}`));
         //const response = await openai.chat(text);
         
         //const messages = [{ role: openai.roles.USER, content: text }];
         ctx.session.messages.push({ role: openai.roles.USER, content: text });

         //const response = await openai.chat(messages);
         const response = await openai.chat(ctx.session.messages);

          ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
          });
         await ctx.reply(response.content);
    } catch (error) {
        console.log("error voice :", error.message);
    }
   
});

// bot.command("start",async (ctx)=>{
//     await ctx.reply(JSON.stringify(ctx.message,null, 2));
// })
bot.on(message("text"), async (ctx) => {
  ctx.session = INITIAL_SESSION;
  try {
    await ctx.reply(code("Сообщение принял. Жду ответ от сервера..."));
   
    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });
    await ctx.reply(response.content);
  } catch (error) {
    console.log("error voice :", error.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));