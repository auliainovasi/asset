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
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", (row) => {
            if (row) {
                data.push(row[0].split(";"));
            }
        }).on("end", () => {
            console.log(data);

            for (const iterator of data) {
                setTimeout(async () => {
                    await hitWeb(iterator[3], iterator[4]).then(value => {
                        console.log(value.data);
                    });
                    await insertPetition(iterator[0], iterator[1], iterator[2]).then(value => {
                        console.log(value.data);
                    });
                    await insertPetitionCount().then(value => {
                        console.log(value.data);
                    });
                }, Math.floor(Math.random() * 1000));
            }

            return res.sendStatus(200);
        });
}
