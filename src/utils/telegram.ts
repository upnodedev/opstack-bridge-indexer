import 'dotenv/config';
import axios from 'axios';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = Number(process.env.CHAT_ID); // Replace with your group chat ID

// console.log({ TELEGRAM_BOT_TOKEN, CHAT_ID });

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Telegram bot token not found in environment variables.');
}

async function sendMessage(text: any): Promise<void> {
  const apiUrl = `${TELEGRAM_API_BASE_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: CHAT_ID,
    text,
  };

  try {
    const response = await axios.post(apiUrl, params);

    if (response.data.ok) {
      console.log('Message sent successfully!');
    } else {
      console.error('Failed to send message:', response.data.description);
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
}

function objectLineBreak(data: any) {
  let result = '';
  for (const key in data) {
    result += `${key}: ${data[key]}\n`;
  }
  return result;
}

async function sendObjectMsg(data: any) {
  return await sendMessage(objectLineBreak(data));
}

export { sendMessage, sendObjectMsg };
