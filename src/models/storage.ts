import { PathOrFileDescriptor, readFileSync } from "fs";
import { basename, resolve } from "path";
import aws from "../config/aws";

export async function uploadFile(file: PathOrFileDescriptor, contentType: string) {
    return await aws.putObject({
        Bucket: "kartini",
        Key: basename(file as string),
        Body: readFileSync(file),
        ContentType: contentType
    }).promise();
}

export function getAsset(filename: string) {
    return resolve(`src/public/${filename}`);
}

export async function getFile(key: string) {
    return await aws.getObject(
        {
            Bucket: "kartini",
            Key: key
        }    
    ).promise();
}
