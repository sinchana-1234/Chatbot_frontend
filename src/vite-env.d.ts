// / <reference types="vite/client" />

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only: Cognito ID token used when running the chatbot standalone (no Glixify session). Set in .env.local. */
  readonly VITE_DEV_ID_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}