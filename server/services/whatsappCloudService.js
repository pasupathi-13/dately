const DEFAULT_PHONE_ID = '1308230419039794';
const DEFAULT_TOKEN = 'EAAVoMdleMX0BSSn6cAPazROD32KwcivHgW8ioUDMDL7jllpdiZALNWt6bbtfaaG9j0UP0HnwUiZAgTc3yPufPZA3dmEEfgHjoqig503bu0UHFm0hEgdUZCmFLcpM1xmZBSXwdvlMR2LtDEcNf6kV4OVwh5wZCf5ZCoOC2t4LMOJiWPl0KMmChzUWfm3rKPjjfESNPuQD71CCjEY3cyR9OlJ6G6kGilLzTCuiDg1iJZBnKGzqBE1wuolZBM1qXiHjrKj9RYRRzG2QZAMu9xOZA9ZBZAZCdnv35qpwZDZD';

/**
 * Normalizes phone numbers to Meta WhatsApp Cloud international format (without leading +)
 * E.g. "+91 98765 43210" -> "919876543210"
 */
export const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Sends a WhatsApp message via Meta WhatsApp Cloud REST API (Port 443 HTTPS)
 */
export const sendWhatsAppMessage = async (toPhone, message) => {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || DEFAULT_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN || DEFAULT_TOKEN;

  const targetNumber = normalizeWhatsAppPhone(toPhone);
  if (!targetNumber) {
    console.warn('[WHATSAPP SKIP] Invalid or missing recipient phone number:', toPhone);
    return { success: false, error: 'Invalid or missing phone number' };
  }

  if (!phoneId || !token) {
    console.log(`[WHATSAPP STANDBY FOR CREDENTIALS] To: ${targetNumber} | Text: ${message.substring(0, 80)}...`);
    return { success: true };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    
    // 1. Try sending as standard text message
    let payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: targetNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json();

    // 2. If 24-hour window restriction requires template, fallback to standard template
    if (!response.ok && data.error?.code === 131047) {
      console.log('[WHATSAPP] 24h window expired, falling back to template message...');
      payload = {
        messaging_product: 'whatsapp',
        to: targetNumber,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      };

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      data = await response.json();
    }

    if (!response.ok) {
      const errMsg = data.error?.error_data?.details || data.error?.message || response.statusText;
      console.error('[WHATSAPP API ERROR]', errMsg);
      return { success: false, error: errMsg, code: data.error?.code };
    }

    console.log(`[WHATSAPP CLOUD API SENT SUCCESS] To: ${targetNumber} | MessageId: ${data.messages?.[0]?.id || 'OK'}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error('[WHATSAPP DISPATCH ERROR]:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an OTP Security Verification Code via WhatsApp
 */
export const sendWhatsAppOtp = async (toPhone, otpCode) => {
  const otpMessage = `🔐 *DATELY VERIFICATION CODE*\n\nYour 6-digit security verification code is: *${otpCode}*\n\nThis code will expire in 10 minutes. Please enter this code in the Dately app to verify your mobile number.\n\n_Best regards,_\n*The Dately Team*`;
  return await sendWhatsAppMessage(toPhone, otpMessage);
};

/**
 * Sends a structured deadline / task alert via WhatsApp
 */
export const sendWhatsAppReminder = async (toPhone, title, details, daysLeftText) => {
  const reminderMessage = `🚨 *DATELY ASSISTANT ALERT*\n\n*Task / Deadline:* ${title}\n*Status:* ${daysLeftText}\n\n${details}\n\n👉 Open your Dately Dashboard: https://dately-ten.vercel.app`;
  return await sendWhatsAppMessage(toPhone, reminderMessage);
};
