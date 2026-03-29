import TLSSigAPIv2 from 'tls-sig-api-v2';

const sdkAppId = Number(process.env.TRTC_SDK_APP_ID);
const secretKey = process.env.TRTC_SDK_SECRET_KEY!;
const api = new TLSSigAPIv2.Api(sdkAppId, secretKey);

export function generateUserSig(userId: string): string {
  return api.genUserSig(userId, 86400 * 7);
}
