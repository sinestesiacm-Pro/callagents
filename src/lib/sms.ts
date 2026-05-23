import twilio from "twilio";

let _twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!_twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("Missing Twilio credentials");
    }
    _twilioClient = twilio(sid, token);
  }
  return _twilioClient;
}

export async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER || "+19129158944";

  const message = await client.messages.create({
    body,
    from,
    to,
  });

  return {
    sid: message.sid,
    status: message.status,
    to,
    from,
  };
}
