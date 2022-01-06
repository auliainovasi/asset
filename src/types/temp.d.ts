export interface Temp {
    level: number;
    step: number;
    answer: boolean;
    data: any[];
    dataPrevious: any[];
    outlet: any,
    voucherNumber: any,
    dateOfBirth: string,
    redeemerId: number,
    name: string,
    postalCode: string,
    gender: string,
    outletId: number,
    location: any,
    refererUserId: number,
    maritalStatus: string,
    lastEducation: string,
    childAge: string,
    averageIncome: string,
    transactionId: number,
    userId: number;
    answerDetailId: number;
    alias: string;
    chatQuestionTriggerId: number;
    type: string;
}

declare module "Temp";
