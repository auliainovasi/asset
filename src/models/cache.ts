import redis from "../config/redis";
import { AnswerData } from "answerData";
import { Temp } from "temp";

export default async function(waId: string, update: boolean = false, level: number = null, step: number = null, answer: boolean = null, data: AnswerData = null, dataPrevious: any = null, outlet: string = null, voucherNumber: any = null, dateOfBirth: string = null, redeemerId: number = null, name: string = null, postalCode: string = null, gender: string = null, outletId: number = null, location: any = null, refererUserId: number = null, maritalStatus: string = null, lastEducation: string = null, childAge: string = null, averageIncome: string = null, transactionId: number = null, userId: number = null, answerDetailId: number = null, alias: string = null, chatQuestionTriggerId: number = null, type: string = null): Promise<Temp> {
    const arr = await redis.get(waId);
    let temp: Temp = {
        level: 1,
        step: 0,
        answer: false,
        data: [],
        dataPrevious: [],
        outlet: null,
        voucherNumber: null,
        dateOfBirth: null,
        redeemerId: null,
        name: null,
        postalCode: null,
        gender: null,
        outletId: null,
        location: null,
        refererUserId: null,
        maritalStatus: null,
        lastEducation: null,
        childAge: null,
        averageIncome: null,
        transactionId: null,
        userId: null,
        answerDetailId: null,
        alias: "",
        chatQuestionTriggerId: null,
        type: "internal"
    };

    if (arr) {
        temp = JSON.parse(arr);
    }

    if (level) {
        temp.level = level;
    }

    if (step) {
        temp.step = step;
    }

    if (answer) {
        temp.answer = answer;
    }

    if (data) {
        temp.data.push(data);
    }

    if (dataPrevious) {
        temp.dataPrevious.push(dataPrevious);
    }

    if (outlet) {
        temp.outlet = outlet;
    }

    if (voucherNumber) {
        temp.voucherNumber = voucherNumber;
    }

    if (dateOfBirth) {
        temp.dateOfBirth = dateOfBirth;
    }

    if (redeemerId) {
        temp.redeemerId = redeemerId;
    }

    if (name) {
        temp.name = name;
    }

    if (postalCode) {
        temp.postalCode = postalCode;
    }

    if (gender) {
        temp.gender = gender;
    }

    if (outletId) {
        temp.outletId = outletId;
    }

    if (location) {
        temp.location = location;
    }

    if (refererUserId) {
        temp.refererUserId = refererUserId;
    }

    if (maritalStatus) {
        temp.maritalStatus = maritalStatus;
    }

    if (lastEducation) {
        temp.lastEducation = lastEducation;
    }

    if (childAge) {
        temp.childAge = childAge;
    }

    if (averageIncome) {
        temp.averageIncome = averageIncome;
    }

    if (transactionId) {
        temp.transactionId = transactionId;
    }

    if (userId) {
        temp.userId = userId;
    }

    if (answerDetailId) {
        temp.answerDetailId = answerDetailId;
    }

    if (alias) {
        temp.alias = alias;
    }

    if (chatQuestionTriggerId) {
        temp.chatQuestionTriggerId = chatQuestionTriggerId;
    }

    if (type) {
        temp.type = type;
    }

    if (update) {
        await redis.setex(waId, 300, JSON.stringify(temp));
    }

    return temp;
}
