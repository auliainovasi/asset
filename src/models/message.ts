import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "https";
import { Property } from "property";

function getProperty(): Property {
    return {
        httpsAgent: new Agent({
            rejectUnauthorized: false
        }),
        headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`
        },
        responseType: null
    };
}

export async function sendMessage(to: string, text: string) {
    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            preview_url: false,
            recipient_type: "individual",
            to: to,
            type: "text",
            text: {
                body: text
            }
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function sendMultipleMessage(to: string, object: string[]) {
    for (const iterator of object) {
        await sendMessage(to, iterator).catch((error) => {
            throw new Error(error);
        });
    }
}

export async function sendImageMessage(to: string, caption: string = "", link: string) {
    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            to: to,
            type: "image",
            recipient_type: "individual",
            image: {
                link: link,
                caption: caption
            }
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function sendVideoMessage(to: string, caption: string = "", mediaId: string) {
    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            to: to,
            type: "video",
            recipient_type: "individual",
            video: {
                caption: caption,
                id: mediaId
	        }
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function sendAudioMessage(to: string, link: string = "") {
    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            to: to,
            type: "audio",
            recipient_type: "individual",
            audio: {
                link: link
	        }
        },
        getProperty() as AxiosRequestConfig
    );
}

function getButton(text: string, indexId: number = 0): object {
    const arr = text.split(". "),
        id = arr[indexId],
        title = arr[1];
    let description = "";

    if (text.match(/--.*--/)) {
        description = text.match(/--(.*)--/)[1];
    }

    return {
        id: id,
        title: title.replace(/--.*--/, "").substring(0, 24),
        description: description.substring(0, 72)
    };
}

export async function sendButtonMessage(to: string, body: string, action: string[], indexId: number = 0) {
    const buttons = [];

    for (const iterator of action) {
        buttons.push({
            type: "reply",
            reply: getButton(iterator, indexId)
        });
    }

    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            to: to,
            recipient_type: "individual",
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: body
                },
                action: {
                    buttons: buttons
                }
            }
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function sendListMessage(to: string, body: string, action: string[]) {
    const buttons = [];

    for (let index = 0; index < action.length; index++) {
        buttons.push(getButton(action[index]));

        if (index == 10) {
            break;
        }
    }

    return await axios.post(
        `${process.env.WA_API}/v1/messages`,
        {
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                body: {
                    text: body
                },
                action: {
                    button: "Pilih",
                    sections: [
                        {
                            rows: buttons
                        }
                    ]
                }
            }
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function updateStatus(messageId: string) {
    return await axios.put(
        `${process.env.WA_API}/v1/messages/${messageId}`,
        {
            status: "read"
        },
        getProperty() as AxiosRequestConfig
    );
}

export async function getMedia(mediaId: string) {
    const property = getProperty();
    property.responseType = "arraybuffer";

    return await axios.get(
        `${process.env.WA_API}/v1/media/${mediaId}`,
        property as AxiosRequestConfig
    );
}
