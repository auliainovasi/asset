import moment from "moment";
import { parse } from "csv-parse";
import { Request, Response } from "express";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import { Options } from "selenium-webdriver/firefox";
import { getAsset } from "../models/storage";
import "dotenv/config";

/**
 * Home API.
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
            output.push(["Telepon", "Nama", "Instagram", "Region", "Area", "Status"].join(","));

            const asyncLoop = async (array: any[][]) => {
                return Promise.all(array.map(async (item) => {
                    for (const iterator of item) {
                        const options = new Options();
                        let status = "Berhasil";
                        let driver: WebDriver;

                        // options.addArguments("--disable-blink-features=AutomationControlled", "--disable-extensions", "--headless");
                        options.addArguments("--disable-blink-features=AutomationControlled", "--disable-extensions");

                        if (process.env.REMOTE_CHROME_HOST) {
                            driver = await new Builder().usingServer(`${process.env.REMOTE_CHROME_HOST}/wd/hub`).withCapabilities({"browserName": "firefox"}).setFirefoxOptions(options).build();
                        } else {
                            driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).build();
                        }

                        try {
                            await driver.get("about:preferences#privacy");

                            const clearButton = await driver.findElement({ xpath: "//*[@id='deleteOnClose']" });

                            await clearButton.click();
                            await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${iterator.regon}&utm_campaign=${iterator.area}`);
                            await driver.sleep(5000);
                            await driver.executeScript("document.querySelector(\"#_evidon-banner-acceptbutton\").click()");
                            await driver.executeScript("document.querySelector(\"#pledge-button\").click()");
                            await driver.executeScript(`document.querySelector("#nama_bunda").setAttribute("value", "${iterator.name}")`);
                            await driver.executeScript(`document.querySelector("#nomor_tlp").setAttribute("value", "${iterator.mobile}")`);
                            await driver.executeScript(`document.querySelector("#tanggal_lahiranak1").setAttribute("value", "${iterator.dob}")`);
                            await driver.executeScript(`document.querySelector("#instagram").setAttribute("value", "${iterator.ig}")`);
                            await driver.executeScript("document.querySelector(\"#agree1\").checked = true");
                            await driver.executeScript("document.querySelector(\"#agree2\").checked = true");
                            await driver.executeScript("document.querySelector(\"#agree3\").checked = true");
                            await driver.executeScript("document.querySelector(\"#certificate-gen\").disabled = false");
                            await driver.executeScript("document.querySelector(\"#certificate-gen\").click()");
                            await driver.sleep(5000);
                        } catch (error) {
                            console.error(error);
                            driver.quit();

                            status = "Gagal";
                        } finally {
                            driver.quit();
                        }

                        const rowData = [iterator.mobile, iterator.name, iterator.ig, iterator.regon, iterator.area, status].join(",");
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
