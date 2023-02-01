declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: string;
            PORT: string;
            WEB_HOST: string;
        }
    }
}

export {};
