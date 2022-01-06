import axios, { AxiosRequestConfig } from "axios";
import { getProperty } from "../data";

export async function getOutletByRadiusPsabbottv1(latitude: number, longitude: number, radius: number = 200): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/v2/project/psabbottv1/outletByRadius?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getPerfectStoreOutlet(outletId: number) {
    return (await axios.get(
        `${process.env.API_HOST}/outletPerfectStore/${outletId}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getPerfectStoreUser(mobile: string): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/psabbottv1/user?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}
