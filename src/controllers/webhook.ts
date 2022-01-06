// const formData = require('form-data');
import moment, { duration as _duration } from "moment";
import cache from "../models/cache";
import redis from "../config/redis";
import { getNow } from "../util/date";
import { insertUserHarvia, whitdrawHarvia, getHarviaBalance, getHarviaReferral, getUserHarviaValidation } from "../models/project/harvia";
import { getOutletByRadiusPsabbottv1, getPerfectStoreOutlet, getPerfectStoreUser } from "../models/project/psabbottv1";
import { sendMessage, sendMultipleMessage, sendImageMessage, sendVideoMessage, sendAudioMessage, sendButtonMessage, sendListMessage, updateStatus, getMedia } from "../models/message";
import { getQuestionCache, getVoucherNumber, getVoucher, updateStatusVoucherNumber, searchIndex, insertRedeemer, getChannel, getRedeemerLimit, getRedeemerMobileValidation, getVoucherById, getChannelyId, insertChatAnswer, getQuestionData, getUser, insertRedeemerProfile, insertFile, getChatQuestionTrigger, getChatQuestion } from "../models/data";
import { AnswerData } from "answerData";
import { Temp } from "temp";
import { getParameterAndCheck } from "../util/header";
import { Request, Response, NextFunction } from "express";

export default async (req: Request, res: Response, next: NextFunction) => {
    getParameterAndCheck(req, res, next);

    const body = req.body;
    const questionTrigger = req.query.question_trigger as string?? null;

    if (body.contacts && body.messages) {
        bot(body, false, questionTrigger);
    }

    return res.sendStatus(200);
};

async function bot(param: any, step: boolean = false, questionTrigger: string = null): Promise<void> {
    const message = param.messages[0],
        waId: string = param.contacts[0].wa_id;
    let temp = await cache(waId),
    data,
    questionData = await getQuestionCache(temp.alias),
    answer = null,
    caption = "",
    link = "",
    text: any,
    action = "",
    buttons = [],
    balance = [];

    // updateStatus(message.id);

    switch (message.type) {
        case "text":
            text = message.text.body;

            if (text.match(/^clear cache$/i)) {
                sendMultipleMessage(waId, endMessage("Cache dibersihkan"));
                redis.flushdb();
                return;
            }

            if (text.toLowerCase() == "batal") {
                sendMultipleMessage(waId, endMessage("Sesi telah dibatalkan"));
                redis.del(waId);
                return;
            }

            break;

        case "interactive":
            switch (message.interactive.type) {
                case "button_reply":
                    text = message.interactive.button_reply;

                    break;

                case "list_reply":
                    text = message.interactive.list_reply;

                    break;
            }

            break;

        case "image":
            text = `${process.env.WA_API}/v1/media/${message.image.id}`;

            break;

        case "location":
            text = `${message.location.longitude};${message.location.longitude}`;

            break;

        default:
            sendMessage(waId, "Jenis pesan tidak didukung");
            return;
    }

    if (temp.level == 1) {
        if (message.type == "interactive" && message.interactive.type == "button_reply") {
            const voucherNumber = await getVoucherNumber("", message.interactive.button_reply.id, "booked");

            if (voucherNumber.length) {
                const voucher = await getVoucherById(voucherNumber[0].voucher_id),
                      channel = await getChannelyId(voucher.channel_id);
                voucherNumber[0].voucher_number_status = "activated";

                updateStatusVoucherNumber(voucherNumber[0]).catch((error) => {
                    throw new Error(error);
                });
                insertRedeemer(waId, voucherNumber[0].voucher_number_id, "activated").catch((error) => {
                    throw new Error(error);
                });
                sendMultipleMessage(waId, endMessage(`${getPrefix(channel.channel_sub_sub_category.toLowerCase())}*${voucherNumber[0].voucher_number}*`));
                return;
            }
        }

        const tempText = text;

        if (questionTrigger) {
            if (message.type == "text" && text.match(/REGHRV;/)) {
                const refererWa = text.replace(/REGHRV;/, ""),
                    userHavia = await getUserHarviaValidation(refererWa);

                if (!userHavia.length) {
                    sendMultipleMessage(waId, endMessage("Pengguna tidak ditemukan"));
                    return;
                }

                const user = await getUserHarviaValidation(waId);

                if (user.length) {
                    sendMultipleMessage(waId, endMessage("Anda sudah terdaftar"));
                    return;
                }

                temp.refererUserId = (await getUserHarviaValidation(refererWa))[0].user_harvia_id;
                temp.step = 58;
                step = true;
            }

            text = questionTrigger;
        }

        const chatQuestionTriggerData = (await getChatQuestionTrigger()).find((obj: { question_trigger: string; }) => obj.question_trigger == text);
        text = tempText;

        if (!chatQuestionTriggerData) {
            sendMessage(waId, "Untuk registrasi, keluhan, dan pertanyaan seputar kartini kirim #KARTINI");
            return;
        }

        temp.type = chatQuestionTriggerData.type;
        temp.alias = chatQuestionTriggerData.alias;
        temp.chatQuestionTriggerId = chatQuestionTriggerData.chat_question_trigger_id;
        questionData = await getQuestionCache(temp.alias, await getChatQuestion(temp.chatQuestionTriggerId));

        temp.level = 2;

        if (process.env.NODE_ENV == "production" && chatQuestionTriggerData.redeemer_limit && await getRedeemerLimit(waId, temp.chatQuestionTriggerId)) {
            sendMultipleMessage(waId, endMessage("Maaf, anda sudah tidak dapat mengaktifkan voucher ini karena anda telah mengikuti program ini"));
            return;
        }

        temp = await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
    }

    if (temp.level == 2) {
        data = questionData[temp.step];
        let dataPrevious = null;

        try {
            balance = await getHarviaBalance(waId).catch((error) => {
                throw new Error(error);
            });
        } catch (error) {}

        if (temp.dataPrevious.length) {
            dataPrevious = temp.dataPrevious[temp.dataPrevious.length - 1];
        }

        if (temp.answer) {
            switch (dataPrevious.question_type) {
                case "two choice":
                    if (message.type != "interactive") {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await textHandling(waId);
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    break;

                case "two choice activation":
                    if (message.type != "interactive") {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await textHandling(waId);
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    if (text.id != "2" && temp.voucherNumber.voucher_number == text.id) {
                        temp.voucherNumber.voucher_number_status = "activated";

                        updateStatusVoucherNumber(temp.voucherNumber).catch((error) => {
                            throw new Error(error);
                        });
                        insertRedeemer(waId, temp.voucherNumber.voucher_number_id, "activated").catch((error) => {
                            throw new Error(error);
                        });
                        text.id = 1;
                    }

                    break;

                case "multiple choice":
                    if (message.type != "interactive") {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await textHandling(waId);
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    if (dataPrevious.question.match(/jenis kelamin/i)) {
                        temp.gender = text.title;
                    }

                    break;

                case "essay":
                    if (dataPrevious.question.match(/masukan tanggal(, bulan dan tahun| lahir)/i)) {
                        if (text.match(/\d+-\d+-\d+/)) {
                            temp.dateOfBirth = text;
                        } else {
                            temp.step = searchIndex(questionData, dataPrevious.question_id);

                            await sendMessage(waId, "Format tanggal lahir tidak sesuai").catch((error) => {
                                throw new Error(error);
                            });
                            await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                            return bot(param, true);
                        }
                    }

                    if (dataPrevious.question.match(/masukan (.|)nama/i)) {
                        if (text.match(/^[a-z\s]+$/i)) {
                            temp.name = text;
                        } else {
                            temp.step = searchIndex(questionData, dataPrevious.question_id);

                            await sendMessage(waId, "Format nama tidak sesuai").catch((error) => {
                                throw new Error(error);
                            });
                            await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                            return bot(param, true);
                        }
                    }

                    if (dataPrevious.question.match(/masukan kode pos/i)) {
                        if (text.match(/\d/)) {
                            temp.postalCode = text;
                        } else {
                            temp.step = searchIndex(questionData, dataPrevious.question_id);

                            await sendMessage(waId, "Kode pos tidak sesuai").catch((error) => {
                                throw new Error(error);
                            });
                            await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                            return bot(param, true);
                        }
                    }

                    if (dataPrevious.question.match(/jumlah/i) && !text.match(/^\d+$/)) {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await sendMessage(waId, "Jawaban harus angka").catch((error) => {
                            throw new Error(error);
                        });
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    break;

                case "insert image":
                    if (message.type != "image") {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await textHandling(waId);
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    // const media = await getMedia(message.image.id);
                    // const form = new formData();
                    // const disposition = media.headers['content-disposition'];
                    // let filename = '';

                    // if (disposition && disposition.indexOf('attachment') != -1) {
                    //     const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    //     const matches = filenameRegex.exec(disposition);

                    //     if (matches != null && matches[1]) { 
                    //         filename = matches[1].replace(/['"]/g, '');
                    //     }
                    // }

                    // form.append('name', `${filename}.webp`);
                    // form.append('file', media.data);
                    // insertFile(form).catch(function (error) {
                    //     console.error(error);
                    //     throw new Error(error);
                    // });
                    break;

                case "location":
                    if (message.type != "location") {
                        temp.step = searchIndex(questionData, dataPrevious.question_id);

                        await textHandling(waId);
                        await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                        return bot(param, true);
                    }

                    temp.outlet = await getOutletByRadiusPsabbottv1(message.location.latitude, message.location.longitude);

                    break;
            }

            switch (dataPrevious.question_execution) {
                case "insert gender":
                    temp.gender = text.title;

                    break;

                case "insert marital status":
                    temp.maritalStatus = text.title;

                    break;

                case "insert last education":
                    temp.lastEducation = text.title;

                    break;

                case "insert child age":
                    temp.childAge = text.title;

                    break;

                case "insert average income":
                    temp.averageIncome = text.title;

                    break;

                case "insert referer user id":
                    temp.refererUserId = text.title;

                    break;

                case "validation redeemer profile":
                    if ((await getRedeemerMobileValidation(waId)).length) {
                        sendMultipleMessage(waId, endMessage("Kamu sudah teregistrasi di KARTINI. Untuk mengubah data, silahkan pilih opsi Ubah Data. Terima kasih."));
                        redis.del(waId);
                        return;
                    }
                    break;

                case "upload data to redeemer profile":
                    await insertRedeemerProfile(temp, waId).catch((error) => {
                        throw new Error(error);
                    });
                    break;

                case "upload data to harvia user":
                    await insertUserHarvia(temp, waId).catch((error) => {
                        throw new Error(error);
                    });
                    break;

                case "perfect store choose outlet":
                    temp.step = JSON.parse(dataPrevious.question_redirect)[0] - 1;
                    temp.dataPrevious = data;
                    temp.outletId = text.id;

                    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                    return bot(param, true);

                case "classic milky age validation":
                    if (message.type == "interactive" && text.id == 2) {
                        break;
                    }

                    const diff = moment(temp.dateOfBirth, "DD-MM-YYYY").diff(moment()),
                        duration = _duration(diff),
                        years = Math.abs(duration.years()),
                        months = Math.abs(duration.months());
                    temp.step = 3;

                    if (years == 1 || years == 2 && months == 0) {
                        temp.step = 10;
                    } else if (years == 2 && months > 0 || years > 2 && years <= 10) {
                        temp.step = 25;
                    }

                    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                    return bot(param, true);

                case "choose outlet":
                    if (message.type == "interactive") {
                        temp.outlet = text.title.toLowerCase();
                    }
                    break;
            }

            const questionRedirect = questionData[temp.step].question_redirect;

            if (questionRedirect && !step) {
                const choose = JSON.parse(questionRedirect);

                if (choose.length > 1) {
                    temp.step = choose[text.id - 1];
                } else {
                    temp.step = choose[0];
                }

                temp.step -= 1;
                let voucherNumberId = null;

                if (temp.step == 0) {
                    await redis.del(waId);
                    return bot(param, false, (await getChatQuestionTrigger(temp.chatQuestionTriggerId.toString())).question_trigger);
                }

                if (temp.voucherNumber) {
                    voucherNumberId = temp.voucherNumber.voucher_number_id;
                }

                await insertChatAnswer(waId, answerData(dataPrevious.question_id, text), voucherNumberId, temp).catch((error) => {
                    // console.error(error);
                    throw new Error(error);
                });
            }

            data = questionData[temp.step];
            answer = answerData(dataPrevious.question_id, text);
        } else {
            if (temp.chatQuestionTriggerId == 4 && message.type == "text" && text.match(/tok-tok harpic/i)) {
                temp.step = 57;
                temp.answer = true;

                await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                return bot(param, true);
            }
        }

        switch (data.question_execution) {
            case "user validation":
                if (!(await getUser(waId)).length) {
                    sendMultipleMessage(waId, endMessage("Nomor belum terdaftar"));
                    redis.del(waId);
                    return;
                }
                break;

            case "perfect store user validation":
                const perfectStoreUser = await getPerfectStoreUser(waId);

                if (!perfectStoreUser.length) {
                    sendMultipleMessage(waId, endMessage("Nomor belum terdaftar"));
                    redis.del(waId);
                    return;
                }

                temp.userId = perfectStoreUser[0].user_id;

                break;

            case "harvia user validation":
                const userHarpic = await getUserHarviaValidation(waId);

                if (userHarpic.length) {
                    temp.step = 97;
                    temp.name = userHarpic[0].name;

                    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                    return bot(param, true);
                }
                break;

            case "withdraw harvia":
                const whitdrawStatus = await whitdrawHarvia(waId);

                if (!whitdrawStatus) {
                    temp.step = 104;

                    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                    return bot(param, true);
                }

                temp.transactionId = whitdrawStatus;

                break;

            case "outlet by alfamidi":
                temp.outlet = "alfamidi";

                break;

            case "outlet by alfamart":
                temp.outlet = "alfamart";

                break;

            case "voucher activated":
                const channel = await getChannel(temp.outlet);

                if (!channel.length) {
                    channelNotFound(waId);
                    redis.del(waId);
                    return;
                }

                const voucher = await getVoucher(channel[0].channel_id, "external", data.sku_id, temp.chatQuestionTriggerId);

                if (!voucher.length) {
                    voucherNotFound(waId);
                    redis.del(waId);
                    return;
                }

                const voucherNumber = await getVoucherNumber(voucher[0].voucher_id);

                if (!voucherNumber.length) {
                    voucherNotFound(waId);
                    redis.del(waId);
                    return;
                }

                temp.voucherNumber = voucherNumber[0];
                temp.voucherNumber.voucher_number_status = "activated";

                updateStatusVoucherNumber(temp.voucherNumber).catch((error) => {
                    throw new Error(error);
                });

                const redeemer = await insertRedeemer(waId, temp.voucherNumber.voucher_number_id, "activated").catch((error) => {
                    throw new Error(error);
                });

                temp.redeemerId = redeemer.data.data.id;

                insertChatAnswer(waId, null, temp.voucherNumber.voucher_number_id, temp).catch((error) => {
                    throw new Error(error);
                });
                break;
        }

        let choose = null;
        data.question = await getQuestionData(data, waId);

        if (data.question_redirect) {
            choose = JSON.parse(data.question_redirect);
        }

        data.question = data.question.replace(/--name--/g, temp.name);
        data.question = data.question.replace(/--gender--/g, temp.gender);
        data.question = data.question.replace(/--date_of_birth--/g, temp.dateOfBirth);
        data.question = data.question.replace(/--referral_code--/, waId);
        data.question = data.question.replace(/--transaction_id--/, "#" + temp.transactionId);
        data.question = data.question.replace(/--date_now--/, getNow().getDate() + "/" + (getNow().getMonth() + 1) + "/" + getNow().getFullYear());
        data.question = data.question.replace(/--time_now--/, getNow().getHours() + ":" + getNow().getMinutes());

        if (data.question.match(/--age--/)) {
            const diff = moment(temp.dateOfBirth, "DD-MM-YYYY").diff(moment(), "milliseconds");
            const duration = _duration(diff);
            data.question = data.question.replace(/--age--/, `${Math.abs(duration.years())} tahun ${Math.abs(duration.months())} bulan`);
        }

        if (data.question.match(/--total_referral--/)) {
            const referral = await getHarviaReferral(waId).catch((error) => {
                throw new Error(error);
            });
            data.question = data.question.replace(/--total_referral--/, referral);
        }

        if (data.question.match(/--referral_balance--/) && balance) {
            data.question = data.question.replace(/--referral_balance--/, balance.referral_balance);
        }

        if (data.question.match(/--total_whitdraw--/) && balance) {
            data.question = data.question.replace(/--total_whitdraw--/, balance.total_whitdraw);
        }

        if (data.question.match(/--total_balance--/) && balance) {
            data.question = data.question.replace(/--total_balance--/, balance.total_balance);
        }

        if (data.question.match(/--perfect_store_outlet--/)) {
            const perfectStoreOutlet = await getPerfectStoreOutlet(temp.outletId).catch((error) => {
                throw new Error(error);
            });
            data.question = data.question.replace(/--perfect_store_outlet--/, perfectStoreOutlet.outlet_kartini_name);
        }

        switch (data.question_type) {
            case "two choice":
                action = data.question.match(/^((?!\d[.]).)*$/gm).join("\n");
                buttons = data.question.match(/^\d.*$/gm);

                sendButtonMessage(waId, action, buttons).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "two choice activation":
                const channel = await getChannel(temp.outlet);

                if (!channel.length) {
                    channelNotFound(waId);
                    redis.del(waId);
                    return;
                }

                const voucher = await getVoucher(channel[0].channel_id, "external", data.sku_id, temp.chatQuestionTriggerId);

                if (!voucher.length) {
                    voucherNotFound(waId);
                    redis.del(waId);
                    return;
                }

                const voucherNumber = await getVoucherNumber(voucher[0].voucher_id);

                if (!voucherNumber.length) {
                    voucherNotFound(waId);
                    redis.del(waId);
                    return;
                }

                temp.voucherNumber = voucherNumber[0];
                temp.voucherNumber.voucher_number_status = "booked";

                updateStatusVoucherNumber(temp.voucherNumber).catch((error) => {
                    throw new Error(error);
                });

                const redeemer = await insertRedeemer(waId, temp.voucherNumber.voucher_number_id);
                temp.redeemerId = redeemer.data.data.id;

                action = data.question.match(/^((?!\d[.]).)*$/gim).join("\n");
                buttons = data.question.match(/^\d.*$/gim);
                buttons[0] = `${voucherNumber[0].voucher_number}. Aktifkan`;

                insertChatAnswer(waId, null, temp.voucherNumber.voucher_number_id, temp).catch((error) => {
                    throw new Error(error);
                });
                sendButtonMessage(waId, `${getPrefix(temp.outlet)}*${(voucherNumber[0].voucher_number).replace(/[\d\w]{1,4}$/, "XXXX")}*`, buttons).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "multiple choice":
                action = data.question.match(/^((?!\d[.]).)*$/gim).join("\n");
                buttons = data.question.match(/^\d.*$/gim);

                sendListMessage(waId, action, buttons).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "multiple choice outlet":
                buttons = [];

                if (!temp.outlet.length) {
                    sendMultipleMessage(waId, endMessage("Outlet disekitar tidak tersedia"));
                    redis.del(waId);
                    return;
                }

                for (const iterator of temp.outlet) {
                    buttons.push(`${iterator.outlet_perfect_store_id}. ${iterator.outlet_kartini_name}`);
                }

                await sendListMessage(waId, data.question, buttons).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "essay":
                sendMessage(waId, data.question).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "text choice":
                await sendMessage(waId, data.question).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "text":
                if (data.question.match(/--voucher_code--/)) {
                    data.question = data.question.replace(/--voucher_code--/, `${getPrefix(temp.outlet)}*${temp.voucherNumber.voucher_number}*`);
                }

                await sendMessage(waId, data.question).catch((error) => {
                    throw new Error(error);
                });

                if (!choose) {
                    await endQuestion(waId, temp, answer);
                    redis.del(waId);
                    return;
                }

                temp.step = choose[0] - 1;
                temp.dataPrevious = data;

                await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                return bot(param, true);

            case "video":
                caption = data.question.replace(/--.*--/, "");
                const mediaId = data.question.match(/--(.*)--/)[1];

                await sendVideoMessage(waId, caption, mediaId).catch((error) => {
                    throw new Error(error);
                });

                if (!choose) {
                    await endQuestion(waId, temp, answer);
                    redis.del(waId);
                    return;
                }

                temp.step = choose[0] - 1;
                temp.dataPrevious = data;

                await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                return bot(param, true);

            case "image":
                if (data.question.match(/--voucher_image--/)) {
                    data.question = data.question.replace(/--voucher_image--/, "");
                    const channel = await getChannel(temp.outlet);

                    if (!channel.length) {
                        channelNotFound(waId);
                        redis.del(waId);
                        return;
                    }

                    const imageVoucher = await getVoucher(channel[0].channel_id, "external", data.sku_id, temp.chatQuestionTriggerId);

                    if (!imageVoucher.length) {
                        await sendMessage(waId, data.question).catch((error) => {
                            throw new Error(error);
                        });
                    } else {
                        await sendImageMessage(waId, data.question, imageVoucher[0].voucher_image).catch((error) => {
                            throw new Error(error);
                        });
                    }

                    temp.step = choose[0] - 1;
                    temp.dataPrevious = data;

                    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                    return bot(param, true);
                }

                caption = data.question.replace(/--.*--/, "");
                link = data.question.match(/--(.*)--/)[1];

                await sendImageMessage(waId, caption, link).catch((error) => {
                    throw new Error(error);
                });

                if (!choose) {
                    await endQuestion(waId, temp, answer);
                    redis.del(waId);
                    return;
                }

                temp.step = choose[0] - 1;
                temp.dataPrevious = data;

                await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                return bot(param, true);

            case "audio":
                link = data.question.match(/--(.*)--/)[1];

                await sendAudioMessage(waId, link).catch((error) => {
                    throw new Error(error);
                });

                if (!choose) {
                    await endQuestion(waId, temp, answer);
                    redis.del(waId);
                    return;
                }

                temp.step = choose[0] - 1;
                temp.dataPrevious = data;

                await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
                return bot(param, true);

            case "insert image":
                await sendMessage(waId, data.question).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "location":
                await sendMessage(waId, data.question).catch((error) => {
                    throw new Error(error);
                });
                break;

            case "end":
                sendMultipleMessage(waId, endMessage(data.question));
                redis.del(waId);
                return;
        }

        temp.dataPrevious = data;
        temp.answer = true;
    }

    await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);
}

async function endQuestion(waId: string, temp: Temp, answer: AnswerData) {
    temp = await cache(waId, true, temp.level, temp.step, temp.answer, answer, temp.dataPrevious, temp.outlet, temp.voucherNumber, temp.dateOfBirth, temp.redeemerId, temp.name, temp.postalCode, temp.gender, temp.outletId, temp.location, temp.refererUserId, temp.maritalStatus, temp.lastEducation, temp.childAge, temp.averageIncome, temp.transactionId, temp.userId, temp.answerDetailId, temp.alias, temp.chatQuestionTriggerId, temp.type);

    sendMessage(waId, endMessage()[0]).catch((error) => {
        throw new Error(error);
    });
}

function answerData(questionId: number, answer: any): AnswerData {
    if (answer.title) {
        answer = answer.title;
    }

    return {
        questionId: questionId,
        answer: answer
    };
}

function getPrefix(outlet: string): string {
    let prefix = "";

    if (outlet == "indomaret") {
        prefix = "i-kupon: ";
    } else if (outlet == "alfamart" || outlet == "alfamidi") {
        prefix = "kode unik: ";
    }

    return prefix;
}

async function textHandling(waId: string) {
    await sendMessage(waId, "Mohon hanya pilih jawaban yang tersedia").catch((error) => {
        throw new Error(error);
    });
}

function voucherNotFound(waId: string) {
    sendMessage(waId, "Voucher tidak tersedia").catch((error) => {
        throw new Error(error);
    });
}

function channelNotFound(waId: string) {
    sendMessage(waId, "Outlet tidak tersedia").catch((error) => {
        throw new Error(error);
    });
}

function endMessage(message: string = null): string[] {
    const arr = ["-Akhir Pesan-"];
    if (message) {
        arr.unshift(message);
    }
    return arr;
}
