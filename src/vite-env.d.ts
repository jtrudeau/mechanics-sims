/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEACHER_UNLOCK_HASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
