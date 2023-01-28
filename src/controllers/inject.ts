/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { getAsset } from "../models/storage";
import { hitWeb, insertPetition, insertPetitionCount } from "../models/data";

/**
 * Inject API example.
 * @route POST /inject
 */
export async function index(req: Request, res: Response) {
    const status = 400;
    const file = req.file;
    const data: any[] = [];

    if (!file) {
        return res.status(status).json({
            status: status,
            error: status,
            messages: "No files were uploaded"
        });
    }

    createReadStream(getAsset(file.filename))
        .pipe(parse({ columns: true }))
        .on("data", (row) => {
            if (row) {
                data.push(row);
            }
        }).on("end", () => {
            console.log(data);

            for (const iterator of data) {
                setTimeout(async () => {
                    await hitWeb(iterator.region, iterator.area);
                    await insertPetition(iterator.name, iterator.mobile, iterator.area).then(value => {
                        console.log(iterator);
                        console.log(value.data);
                    });
                    await insertPetitionCount();
                }, Math.floor(getRandomArbitrary(5, 120) * 1000));
            }

            return res.sendStatus(200);
        });
}

function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
