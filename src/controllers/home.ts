import { Request, Response } from "express";
import { getFile } from "../models/storage";

export default async (req: Request, res: Response) => {
    getFile(req.params.id).then(img => {
        res.setHeader("Content-Type", img.ContentType);
        return res.send(img.Body);
    }).catch(() => {
        return res.status(404).send("File Not Found");
    });
};
