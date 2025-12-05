// Fix: Remove missing vite/client reference and use namespace augmentation to type process.env.API_KEY
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    [key: string]: string | undefined;
  }
}
