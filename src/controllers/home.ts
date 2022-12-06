import { Request, Response } from "express";
import { getAsset, getFile, uploadFile } from "../models/storage";

/**
 * Index API example.
 * @route GET /
 */
export async function index(req: Request, res: Response) {
    let status = 400;
    const file = req.file;

    if (!file) {
        return res.status(status).json({
            status: status,
            error: status,
            messages: "No files were uploaded"
        });
    }

    const filename = file.filename;
    status = 201;

    await uploadFile(getAsset(filename), file.mimetype);
    return res.status(status).json({
        status: status,
        data: {
            id: filename
        }
    });
}

/**
 * Id API example.
 * @route GET /:id
 */
export function getId(req: Request, res: Response) {
    getFile(req.params.id).then(img => {
        const buf = Buffer.from(img.Body as Buffer);

        res.setHeader("Content-Type", img.ContentType);
        res.setHeader("Content-Length", buf.length);
        return res.send(img.Body);
    }).catch(() => {
        return res.status(404).send("File Not Found");
    });
}
