import { Request, Response } from "express";
import { getAsset, getFile, uploadFile } from "../models/storage";

export function get(req: Request, res: Response) {
    getFile(req.params.id).then(img => {
        const buf = Buffer.from(img.Body as Buffer);

        res.setHeader("Content-Type", img.ContentType);
        res.setHeader("Content-Length", buf.length);
        return res.send(img.Body);
    }).catch(() => {
        return res.status(404).send("File Not Found");
    });
}

export async function post(req: Request, res: Response) {
    let status = 400;

    if (!req.file) {
        return res.status(status).json({
            status: status,
            error: status,
            messages: "No files were uploaded"
        });
    }

    const file = req.file;
    const filename = file.filename;
    status = 201;

    await uploadFile(getAsset(filename), file.mimetype).catch((error) => {
        throw new Error(error);
    });
    return res.status(status).json({
        status: status,
        data: {
            id: filename
        }
    });
}
