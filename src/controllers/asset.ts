import { Request, Response } from "express";
import AWS from "aws-sdk";

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(
        "https://ap-south-1.linodeobjects.com"
    ),
    region: "ap-south-1",
    accessKeyId: "NHC2PXBAXKY0OY5TN5VO",
    secretAccessKey: "1ESx1eK2X8s2DzmtpjEHoz9AVeKYtd9jJhdftX2B"
});

export default async (req: Request, res: Response) => {
    let id: string = req.params.id.replace(/-/g, "");

    if (id.length > 24) {
		id = id.substring(id.length - 24);
	}

    console.log(id);

    getImage(id).then((img: any) => {
        const image = "<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
        const startHTML = "<html><body></body>";
        const endHTML = "</body></html>";
        const html = startHTML + image + endHTML;

        return res.send(html);
    }).catch((e: any) => {
        return res.sendStatus(404);
    });
};

async function getImage(key: string) {
    return await s3.getObject(
        {
            Bucket: "kartini",
            Key: key
        }    
    ).promise();
}

function encode(data: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>) {
    const buff = Buffer.from(data);

    return buff.toString("base64");
}
