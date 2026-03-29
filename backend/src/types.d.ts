declare module 'tencentcloud-sdk-nodejs-intl-en' {
  const sdk: any;
  export = sdk;
}

declare module 'tls-sig-api-v2' {
  namespace TLSSigAPIv2 {
    class Api {
      constructor(sdkAppId: number, key: string);
      genUserSig(userId: string, expire: number): string;
    }
  }
  export = TLSSigAPIv2;
}
