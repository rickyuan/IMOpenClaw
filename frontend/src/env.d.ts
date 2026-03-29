/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SDK_APP_ID: string;
  readonly VITE_BOT_USERID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
