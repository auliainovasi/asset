import { Request, Response } from "express";
import { getFile } from "../models/storage";

export default (req: Request, res: Response) => {
    getFile(req.params.id).then(img => {
        const buf = Buffer.from(img.Body as Buffer);

        res.setHeader("Content-Type", img.ContentType);
        res.setHeader("Content-Length", buf.length);
        return res.send(img.Body);
    }).catch(() => {
        return res.status(404).send("File Not Found");
    });
};
