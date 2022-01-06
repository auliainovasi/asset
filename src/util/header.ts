import { Request, Response, NextFunction } from "express";

export function getParameterAndCheck(req: Request, res: Response, next: NextFunction) {
    const key = req.query.key as string?? null;

    if (key) {
        if (atob(key) !== process.env.KEY) {
            return res.sendStatus(401);
        }

        next();
    } else {
        return res.sendStatus(401);
    }
}
