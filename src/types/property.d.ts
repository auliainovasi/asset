import { Agent } from "http";

export interface Property {
    httpsAgent: Agent;
    headers: object;
    responseType: string;
}

declare module "Property";
