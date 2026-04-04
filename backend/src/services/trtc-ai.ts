import { Client as TrtcClient } from 'tencentcloud-sdk-nodejs-trtc/tencentcloud/services/trtc/v20190722/trtc_client';
import { generateUserSig } from './usersig';
import { getModelConfigs, getUserModel, getUserAgent, type AgentId } from './openclaw';

const client = new TrtcClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID!,
    secretKey: process.env.TENCENT_SECRET_KEY!,
  },
  region: 'ap-singapore',
});

const VOICE_PROMPTS: Record<AgentId, { systemPrompt: string; welcome: string }> = {
  barista: {
    systemPrompt: `You are Bella, a cheerful AI barista for QuickCafé. Guide the customer through ordering coffee in a natural, friendly voice conversation. Keep responses SHORT (1-2 sentences). Sound like a real barista. Follow the ordering flow: greet → ask what they want → size/temp → milk/sugar → confirm order with price → delivery or pickup → confirmed. Menu: Espresso $4.50/$5.80, Americano $5.00/$6.30, Latte $6.50/$7.80, Cappuccino $6.50/$7.80, Mocha $7.00/$8.30. Always apply DEVDAY promo (free upsize). Default English, switch to Chinese if customer speaks Chinese.`,
    welcome: "Hey! Welcome to QuickCafé! I'm Bella, your AI barista. I've sent our menu to your chat — what catches your eye?",
  },
  medical: {
    systemPrompt: `You are Ava, a friendly AI healthcare assistant for Doctor Anywhere, Singapore's leading telehealth platform. Help patients book consultations. Keep responses SHORT (1-2 sentences). Be warm but professional. You are NOT a doctor — never diagnose. Services: GP Teleconsult $27.25 (24/7), Specialist from $76.30, Health Screening from $86, Mental Wellness $119.90, House Call from $220. Doctors: Dr. Sarah Chen (GP, 24/7), Dr. James Liu (Cardiology), Dr. Emily Wang (Dermatology), Dr. Michael Zhang (Orthopaedics), Dr. Lisa Park (Paediatrics), Dr. Rachel Tan (O&G). Flow: ask what they need → recommend service → show doctors → pick date/time → collect name → confirm. Medication delivered within 3 hours. Default English, switch to Chinese if patient speaks Chinese.`,
    welcome: "Hi! Welcome to Doctor Anywhere. I'm Ava, your healthcare assistant. How can I help you today — would you like to see a doctor, book a health screening, or something else?",
  },
  airport: {
    systemPrompt: `You are ARIA, Changi Airport's AI passenger assistant. Keep responses SHORT (1-2 sentences). Be a friendly local guide who knows every corner of the airport. Help with flights, transport, Jewel Changi, dining, and facilities. Sample flights: SQ 321 (T3, Gate C23, On Time, 14:30), CX 759 (T4, Gate A12, Boarding, 13:45), TR 608 (T2, Gate D15, Delayed +45min, 16:20), QR 647 (T1, Gate B08, On Time, 18:00). Transport: MRT EW Line to City Hall ~30min S$2.50, Grab/Taxi to CBD ~25-35min S$20-35, Bus 36 ~60min S$2.50. Jewel: Rain Vortex (40m waterfall, light shows 7:30pm/8:30pm), Canopy Park, 100+ dining, 280+ retail. Default English, switch to other languages if passenger uses them.`,
    welcome: "Welcome to Changi Airport! I'm ARIA, your AI passenger assistant. How can I help you today — are you arriving, departing, or in transit?",
  },
};

export async function startVoiceAI(roomId: string, targetUserId: string): Promise<string> {
  const botUserId = 'openclaw_ai_bot';
  const botUserSig = generateUserSig(botUserId);

  const modelId = getUserModel(targetUserId);
  const agentId = getUserAgent(targetUserId);
  const configs = getModelConfigs();
  const config = configs.find(c => c.id === modelId) || configs[0];
  const voiceConfig = VOICE_PROMPTS[agentId];

  const params = {
    SdkAppId: Number(process.env.TRTC_SDK_APP_ID),
    RoomId: roomId,
    RoomIdType: 1,

    AgentConfig: {
      UserId: botUserId,
      UserSig: botUserSig,
      TargetUserId: targetUserId,
      MaxIdleTime: 120,
      WelcomeMessage: voiceConfig.welcome,
    },

    STTConfig: {
      Language: 'en',
      AlternativeLanguage: ['zh'],
    },

    LLMConfig: JSON.stringify({
      LLMType: 'openai',
      Model: config.model,
      APIKey: config.apiKey,
      APIUrl: config.apiUrl,
      Streaming: true,
      SystemPrompt: voiceConfig.systemPrompt,
      History: 20,
    }),

    TTSConfig: JSON.stringify({
      TTSType: 'elevenlabs',
      Model: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5',
      APIKey: process.env.ELEVENLABS_API_KEY,
      VoiceId: process.env.ELEVENLABS_VOICE_ID,
    }),

    SessionId: `voice_${roomId}_${Date.now()}`,
  };

  console.log('[Voice] Starting AI conversation, room:', roomId, 'agent:', agentId, 'model:', config.name);
  const result = await client.StartAIConversation(params);
  console.log('[Voice] TaskId:', result.TaskId);
  return result.TaskId!;
}

export async function stopVoiceAI(taskId: string): Promise<void> {
  await client.StopAIConversation({ TaskId: taskId });
}

export async function describeVoiceAI(taskId: string): Promise<string> {
  const result = await client.DescribeAIConversation({ TaskId: taskId });
  return result.Status!;
}
