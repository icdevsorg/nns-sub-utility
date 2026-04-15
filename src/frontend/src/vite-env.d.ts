/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IC_HOST?: string;
  readonly VITE_II_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
