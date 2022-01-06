import { getMedia } from "../models/message";
import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
    try {
        const media = await getMedia(req.params.mediaId);

        res.setHeader("Content-Type", media.headers["content-type"]);
        return res.send(media.data);
    } catch (error) {
        return res.sendStatus(404);
    }
};
