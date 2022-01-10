import { PathOrFileDescriptor, readFile } from "fs";
import path from "path";
import aws from "../config/aws";

export async function uploadFile(file: PathOrFileDescriptor, contentType: string) {
    readFile(file, {}, async (error, data) => {
        await aws.putObject({
            Bucket: "kartini",
            Key: path.basename(file as string),
            Body: data,
            ContentType: contentType
        }).promise();
    });
}

export async function getFile(key: string) {
    return await aws.getObject(
        {
            Bucket: "kartini",
            Key: key
        }    
    ).promise();
}
