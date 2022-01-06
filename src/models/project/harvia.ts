import axios, { AxiosRequestConfig } from "axios";
import { getProperty } from "../data";
import { Temp } from "temp";

export async function getHarviaBalance(mobile: string) {
    return (await axios.get(
        `${process.env.API_HOST}/v2/project/harvia/balanceDetail?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getHarviaReferral(mobile: string): Promise<number> {
    return (await axios.get(
        `${process.env.API_HOST}/v2/project/harvia/referral?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data.value;
}

export async function getUserHarviaValidation(mobile: string): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/userHarvia?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function insertUserHarvia(temp: Temp, mobile: string) {
    return axios.post(
        `${process.env.API_HOST}/userHarvia`,
        {
            "name": temp.name,
            "mobile": mobile,
            "referer_user_id": temp.refererUserId
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function whitdrawHarvia(mobile: string): Promise<number> {
    const harviaBalance = await getHarviaBalance(mobile);

    if (harviaBalance.total_balance < 10000) {
        return null;
    }

    const harviaUser = await getUserHarviaValidation(mobile),
          harviaTransaction = await axios.post(
        `${process.env.API_HOST}/harvia/transaction`,
        {
            "description": `Penarikan poin ${harviaBalance.total_balance}`,
            "status": "waiting",
            "user_harvia_id": harviaUser[0].user_harvia_id
        },
        getProperty() as AxiosRequestConfig
    );

    axios.post(
        `${process.env.API_HOST}/harvia/balance`,
        {
            "debit": 0,
            "credit": harviaBalance.total_balance,
            "harvia_transaction_id": harviaTransaction.data.data.id
        },
        getProperty() as AxiosRequestConfig
    );

    return harviaTransaction.data.data.id;
}
