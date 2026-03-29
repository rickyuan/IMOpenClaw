import { generateUserSig } from './usersig';

function buildIMUrl(): string {
  const sdkAppId = process.env.TRTC_SDK_APP_ID!;
  const adminUserId = process.env.IM_ADMIN_USERID!;
  const userSig = generateUserSig(adminUserId);
  const imDomain = process.env.IM_API_DOMAIN || 'adminapisgp.im.qcloud.com';
  const random = Math.floor(Math.random() * 4294967295);
  return `https://${imDomain}/v4/openim/sendmsg?sdkappid=${sdkAppId}&identifier=${adminUserId}&usersig=${userSig}&random=${random}&contenttype=json`;
}

async function sendIM(toUserId: string, msgBody: any[]): Promise<void> {
  const botUserId = process.env.IM_BOT_USERID!;
  const url = buildIMUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      SyncOtherMachine: 1,
      From_Account: botUserId,
      To_Account: toUserId,
      MsgRandom: Math.floor(Math.random() * 4294967295),
      MsgBody: msgBody,
    }),
  });

  if (!response.ok) {
    console.error(`Chat API error: ${response.status} ${response.statusText}`);
  } else {
    const result: any = await response.json();
    if (result.ErrorCode !== 0) {
      console.error(`Chat API error: ${result.ErrorCode} ${result.ErrorInfo}`);
    }
  }
}

export async function sendBotMessage(toUserId: string, text: string): Promise<void> {
  await sendIM(toUserId, [
    { MsgType: 'TIMTextElem', MsgContent: { Text: text } },
  ]);
}

export async function sendBotCustomMessage(
  toUserId: string,
  cardType: string,
  data: Record<string, any>,
  description: string,
): Promise<void> {
  await sendIM(toUserId, [
    {
      MsgType: 'TIMCustomElem',
      MsgContent: {
        Data: JSON.stringify({ type: cardType, ...data }),
        Desc: description,
        Ext: 'quickcafe_card',
      },
    },
  ]);
}
