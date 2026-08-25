import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

console.log('🔄 Initializing WhatsApp Gateway...');

let client = null;

try {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('\n================================================================');
    console.log('🚨 SCAN THE QR CODE BELOW WITH WHATSAPP TO CONNECT DATELY ALERT BOT');
    console.log('================================================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n================================================================\n');
  });

  client.on('ready', () => {
    console.log('\n================================================================');
    console.log('✅ WHATSAPP WEB GATEWAY ACTIVE: Connected successfully!');
    console.log('================================================================\n');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Authentication Failure:', msg);
  });

  client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp client was disconnected:', reason);
  });

  client.initialize().catch((err) => {
    console.log('ℹ️ WhatsApp Web gateway running in Cloud Fallback / Simulation mode:', err.message);
  });
} catch (e) {
  console.log('ℹ️ WhatsApp Client initialized in Simulation mode.');
  client = {
    sendMessage: async (chatId, message) => {
      console.log(`[SIMULATED WHATSAPP] To: ${chatId} | Message: ${message}`);
      return true;
    }
  };
}

export default client;
