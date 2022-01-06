import axios, { Method, AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import moment from "moment";
import cache from "./cache";
import redis from "../config/redis";
import { getNow } from "../util/date";
import { getPerfectStoreUser } from "./project/psabbottv1";
import { AnswerData } from "answerData";
import { Property } from "property";
import { Temp } from "temp";

export async function getQuestionCache(key: string, data: any = null) {
    if (data) {
        await redis.setex(key, 604800, JSON.stringify(data));
    }

    data = await redis.get(key);

    return JSON.parse(data === undefined? "": data);
}

export function getProperty(): Property {
    return {
        httpsAgent: null,
        headers: {
            "X-Kartini-Signature": "a2FydGluaUAyMDIy"
        },
        responseType: null
    };
}

async function getBrandTemplate(data: any): Promise<string> {
    const response = (await axios.get(
        `${process.env.API_HOST}/brand/${data.brand_id}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
    const callback = data.question.replace(/--brand_id--/g, response.brand_name);

    return callback;
}

async function getDisplayTemplate(data: any): Promise<string> {
    const response = (await axios.get(
        `${process.env.API_HOST}/sab/display/${data.sab_display_id}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
    const callback = data.question.replace(/--sab_display_id--/g, response.display_name);

    return callback;
}

async function getSkuTemplate(data: any): Promise<string> {
    const response = (await axios.get(
        `${process.env.API_HOST}/sku/${data.sku_id}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
    const callback = data.question.replace(/--sku_id--/g, response.sku_name);

    return callback;
}

async function getPerfectStoreUserTemplate(data: any, waId: string): Promise<string> {
    const response = await getPerfectStoreUser(waId),
          callback = data.question.replace(/--name_perfect_store--/g, `${response[0].name}`);

    return callback;
}

export async function getQuestionData(data: any, waId: string): Promise<string> {
    if (data.brand_id) {
        data.question = await getBrandTemplate(data);
    }

    if (data.sab_display_id) {
        data.question = await getDisplayTemplate(data);
    }

    if (data.sku_id) {
        data.question = await getSkuTemplate(data);
    }

    if (data.question.match(/--name_perfect_store--/)) {
        data.question = await getPerfectStoreUserTemplate(data, waId);
    }

    return data.question;
}

export async function getChatQuestionTrigger(chatQuestionTriggerId: string = "") {
    return (await axios.get(
        `${process.env.API_HOST}/chat/questionTrigger/${chatQuestionTriggerId}?status=active`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getChatQuestion(chatQuestionTriggerId: number): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/v2/data/chatQuestion?chat_question_trigger_id=${chatQuestionTriggerId}&status=active`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getVoucher(channelId: number, voucherType: string, skuId: number, chatQuestionTriggerId: number): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/voucher?channel_id=${channelId}&sku_id=${skuId}&voucher_type=${voucherType}&chat_question_trigger_id=${chatQuestionTriggerId}&status=active`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getVoucherById(voucherId: number) {
    return (await axios.get(
        `${process.env.API_HOST}/voucher/${voucherId}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getVoucherNumber(voucherId: string = "", voucherNumber: string = "", voucherNumberStatus: string = "open"): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/voucherNumber?voucher_number_status=${voucherNumberStatus}&voucher_id=${voucherId}&voucher_number=${voucherNumber?? ""}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getChannel(channelSubSubCategory: string): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/channel?channel_sub_sub_category=${channelSubSubCategory}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getChannelyId(channeld: number) {
    return (await axios.get(
        `${process.env.API_HOST}/channel/${channeld}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getRedeemerLimit(mobile: string, chatQuestionTriggerId: number = 0): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/v2/redeemer/limit?mobile=${mobile}&chat_question_trigger_id=${chatQuestionTriggerId}`,
        getProperty() as AxiosRequestConfig
    )).data.data.value;
}

export async function getRedeemerMobileValidation(mobile: string): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/redeemerProfile?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function getUser(mobile: string): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/user?mobile=${mobile}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function updateStatusVoucherNumber(data: any) {
    return await axios.put(
        `${process.env.API_HOST}/voucherNumber/${data.voucher_number_id}`,
        data,
        getProperty() as AxiosRequestConfig
    );
}

export async function getRedeemer(mobile: string, voucherNumberId: number): Promise<any[]> {
    return (await axios.get(
        `${process.env.API_HOST}/redeemer?mobile=${mobile}&voucher_number_id=${voucherNumberId}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function insertRedeemer(mobile: string, voucherNumberId: number, status: string = null) {
    const redeemer = await getRedeemer(mobile, voucherNumberId);
    let method = "put", 
        extend = "";

    if (!redeemer.length) {
        redeemer[0] = {
            mobile: mobile,
            voucher_number_id: voucherNumberId,
            booked_status_date: getNow().toJSON()
        };
        method = "post";
    } else {
        extend = `/${redeemer[0].redeemer_id}`;
    }

    switch (status) {
        case "open":
            redeemer[0].open_status_date = getNow().toJSON();

            break;

        case "activated":
            redeemer[0].activated_status_date = getNow().toJSON();

            break;

        case "redeemed":
            redeemer[0].redeemed_status_date = getNow().toJSON();

            break;
    }

    return await axios({
        method: method as Method,
        url: `${process.env.API_HOST}/redeemer${extend}`,
        data: redeemer[0],
        headers: getProperty().headers as AxiosRequestHeaders
    });
}

export async function getChatAnswerDetail(chatAnswerDetailId: number, temp: Temp) {
    return (await axios.get(
        `${process.env.API_HOST}/${temp.type == "internal"? "chat": temp.alias}/answerDetail/${chatAnswerDetailId}`,
        getProperty() as AxiosRequestConfig
    )).data.data;
}

export async function insertChatAnswer(mobileNumber: string, answerData: AnswerData, voucherNumberId: number, temp: Temp) {
    let chatAnswerDetail: any = [],
        method = "put",
        extend = "";

    if (!temp.answerDetailId) {
        chatAnswerDetail = {
            mobile_number: mobileNumber,
            chat_question_trigger_id: temp.chatQuestionTriggerId
        };
        method = "post";
    } else {
        chatAnswerDetail = await getChatAnswerDetail(temp.answerDetailId, temp);
        extend = `/${chatAnswerDetail.answer_detail_id}`;
        chatAnswerDetail.voucher_number_id = voucherNumberId;
        chatAnswerDetail.redeemer_id = temp.redeemerId;
        chatAnswerDetail.outlet_id = temp.outletId;
        chatAnswerDetail.outlet_perfect_store_id = temp.outletId;
        chatAnswerDetail.user_id = temp.userId;
    }

    const answerDetailData = await axios({
        method: method as Method,
        url: `${process.env.API_HOST}/${temp.type == "internal"? "chat": temp.alias}/answerDetail${extend}`,
        data: chatAnswerDetail,
        headers: getProperty().headers as AxiosRequestHeaders
    });

    if (!answerData) {
        return answerDetailData;
    }

    if (method == "post") {
        temp.answerDetailId = answerDetailData.data.data.id;

        await cache(mobileNumber, true, temp.level, temp.step, temp.answer, null, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
    }

    return await axios.post(
        `${process.env.API_HOST}/${temp.type == "internal"? "chat": temp.alias}/answer`,
        {
            question_id: answerData.questionId,
            answer: answerData.answer,
            answer_detail_id: temp.answerDetailId
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function insertRedeemerProfile(temp: Temp, mobile: string) {
    await axios.post(
        `${process.env.API_HOST}/redeemerProfile`,
        {
            mobile: mobile,
            name: temp.name,
            date_of_birth: moment(temp.dateOfBirth, "DD-MM-YYYY").format(),
            gender: temp.gender,
            marital_status: temp.maritalStatus,
            last_education: temp.lastEducation,
            child_age: temp.childAge,
            average_income: temp.averageIncome,
            postal_code: temp.postalCode
        },
        getProperty() as AxiosRequestConfig
    );

    // sinkron redeemer
}

export async function insertFile(data: any) {
    return await axios({
        url: `${process.env.API_HOST}/file`,
        data: data,
        headers: getProperty().headers as AxiosRequestHeaders
    });
}

export function searchIndex(question: any[], questionId: number) {
    return question.findIndex(obj => obj.question_id as number == questionId);
}
