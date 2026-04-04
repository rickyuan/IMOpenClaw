/**
 * Configuration & Environment Validation
 *
 * Validates all required environment variables at startup and provides
 * typed access to configuration values. Fails fast with clear errors.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Tencent Cloud
  { key: 'TRTC_SDK_APP_ID', required: true, description: 'TRTC SDK App ID' },
  { key: 'TRTC_SDK_SECRET_KEY', required: true, description: 'TRTC SDK Secret Key' },
  { key: 'TENCENT_SECRET_ID', required: true, description: 'Tencent Cloud Secret ID (for TRTC API)' },
  { key: 'TENCENT_SECRET_KEY', required: true, description: 'Tencent Cloud Secret Key (for TRTC API)' },

  // LLM (at least LLM_1 must be configured)
  { key: 'LLM_1_MODEL', required: true, description: 'First LLM model name (e.g. openclaw:main)' },
  { key: 'LLM_1_API_URL', required: true, description: 'First LLM API endpoint URL' },
  { key: 'LLM_1_API_KEY', required: true, description: 'First LLM API key' },

  // IM Chat
  { key: 'IM_BOT_USERID', required: true, description: 'IM bot user ID (e.g. openclaw_bot)' },

  // Optional
  { key: 'TCLOUD_APP_ID', required: false, description: 'Tencent Cloud App ID (for TTS)' },
  { key: 'ELEVENLABS_API_KEY', required: false, description: 'ElevenLabs TTS API key' },
  { key: 'ELEVENLABS_VOICE_ID', required: false, description: 'ElevenLabs voice ID' },
  { key: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth client secret' },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const v of ENV_VARS) {
    if (v.required && !process.env[v.key]) {
      missing.push(`  ${v.key} — ${v.description}`);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    console.error(missing.join('\n'));
    console.error('\nSee .env.example for the full template.\n');

    // Don't crash in development — just warn
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      process.exit(1);
    }
  }
}

export const config = {
  get port(): number {
    return Number(process.env.PORT) || 3000;
  },
  get isVercel(): boolean {
    return !!process.env.VERCEL;
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  },
  get sdkAppId(): number {
    return Number(process.env.TRTC_SDK_APP_ID);
  },
  get botUserId(): string {
    return process.env.IM_BOT_USERID || 'openclaw_bot';
  },
};
