import { Client as TrtcClient } from 'tencentcloud-sdk-nodejs-trtc/tencentcloud/services/trtc/v20190722/trtc_client';
import { generateUserSig } from './usersig';
import { getAgent } from '../agents/registry';
import { getProvider } from '../providers/registry';
import { getUserModel, getUserAgent } from '../state/user-preferences';

const client = new TrtcClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID!,
    secretKey: process.env.TENCENT_SECRET_KEY!,
  },
  region: 'ap-singapore',
});

export async function startVoiceAI(roomId: string, targetUserId: string): Promise<string> {
  const botUserId = 'openclaw_ai_bot';
  const botUserSig = generateUserSig(botUserId);

  const modelId = getUserModel(targetUserId, '1');
  const agentId = getUserAgent(targetUserId, 'barista');
  const provider = getProvider(modelId);
  const agent = getAgent(agentId);

  const params = {
    SdkAppId: Number(process.env.TRTC_SDK_APP_ID),
    RoomId: roomId,
    RoomIdType: 1,

    AgentConfig: {
      UserId: botUserId,
      UserSig: botUserSig,
      TargetUserId: targetUserId,
      MaxIdleTime: 120,
      WelcomeMessage: agent.voiceWelcomeMessage,
    },

    STTConfig: {
      Language: 'en',
      AlternativeLanguage: ['zh'],
    },

    LLMConfig: JSON.stringify({
      LLMType: 'openai',
      Model: provider.model,
      APIKey: provider.apiKey,
      APIUrl: provider.apiUrl,
      Streaming: true,
      SystemPrompt: agent.voiceSystemPrompt,
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

  console.log('[Voice] Starting AI conversation, room:', roomId, 'agent:', agentId, 'model:', provider.name);
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
