import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

console.log('🔄 Initializing WhatsApp Web Client...');

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth' // Persists session data locally
  }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
  setTimeout(() => {
    console.log('🔄 Attempting to re-initialize WhatsApp client...');
    client.initialize().catch(err => console.error('Failed to re-initialize WhatsApp:', err.message));
  }, 10000);
});

client.initialize().catch(err => {
  console.error('❌ WhatsApp Web client initialization failed:', err.message);
});

export default client;
