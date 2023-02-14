/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "csv-parse";
import { Request, Response } from "express";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { getAsset } from "../models/storage";
import moment from "moment";

/**
 * Home API example.
 * @route POST /
 */
export async function index(req: Request, res: Response) {
    const status = 400;
    const file = req.file;
    const data: any[] | any[][] = [];
    let worker = req.body.worker;

    if (!file) {
        return res.status(status).json({
            status: status,
            error: status,
            messages: "No files were uploaded"
        });
    }

    createReadStream(getAsset(file.filename))
        .pipe(parse({ columns: true }))
        .on("data", async (row) => {
            if (row) {
                data.push(row);
            }
        }).on("end", async () => {
            const output: any[] = [];
            const middleIndex = Math.ceil(data.length / worker);
            let result = [];

            if (!worker) {
                worker = 1;
            }

            for (let i = 0; i < worker; i++) {
                result.push(data.splice(-middleIndex));
            }

            result = result.reverse();

            res.sendStatus(200);
            output.push(["Telepon", "Nama", "Region", "Area", "Status"].join(","));

            const asyncLoop = async (array: any[][]) => {
                return Promise.all(array.map(async (item) => {
                    for (const iterator of item) {
                        const options = new Options();
                        let status = "Berhasil";
                        let driver: WebDriver;

                        options.addArguments("--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--disable-extensions", "--incognito");
                        options.setUserPreferences({ "profile.default_content_settings.cookies": 2 });

                        if (process.env.REMOTE_CHROME_HOST) {
                            driver = await new Builder().usingServer(`${process.env.REMOTE_CHROME_HOST}/wd/hub`).withCapabilities({"browserName": "chrome"}).setChromeOptions(options).build();
                        } else {
                            driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
                        }

                        try {
                            await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${iterator.regon}&utm_campaign=${iterator.area}`);
                            await driver.sleep(10000);
                            await driver.executeScript("document.querySelector(\"#_evidon-banner-acceptbutton\").click()");
                            await driver.executeScript("document.querySelector(\"#pledge-button\").click()");
                            await driver.executeScript(`document.querySelector("#nama_bunda").setAttribute("value", "${iterator.name}")`);
                            await driver.executeScript(`document.querySelector("#nomor_tlp").setAttribute("value", "${iterator.mobile}")`);
                            await driver.executeScript(`document.querySelector("#instagram").setAttribute("value", "${iterator.name.split(" ")[0]}")`);
                            await driver.executeScript("document.querySelector(\"#agree1\").checked = true");
                            await driver.executeScript("document.querySelector(\"#agree2\").checked = true");
                            await driver.executeScript("document.querySelector(\"#certificate-gen\").disabled = false");
                            await driver.executeScript("document.querySelector(\"#certificate-gen\").click()");
                            await driver.sleep(5000);
                        } catch (error) {
                            driver.quit();

                            status = "Gagal";
                        } finally {
                            driver.quit();
                        }

                        const rowData = [iterator.mobile, iterator.name, iterator.regon, iterator.area, status].join(",");
                        let dirname = moment().format("YYYY-MM-DD");

                        checkDirectory(dirname);

                        dirname += `/${status.toLowerCase()}`;

                        checkDirectory(dirname);
                        writeFileSync(getAsset(`${dirname}/${iterator.mobile}.csv`), rowData);
                        output.push(rowData);
                        console.clear();
                        console.log(output.join("\n"));
                    }
                }));
            };

            asyncLoop(result).then(() => {
                writeFileSync(getAsset(`${moment().format("YYYY-MM-DD")}/${new Date().getTime()}.csv`), output.join("\n"));
            });
        });
}

function checkDirectory(path: string) {
    path = getAsset(path);

    if (existsSync(path)) {
      return true;
    }

    mkdirSync(path);
}
