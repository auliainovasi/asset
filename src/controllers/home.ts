/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "csv-parse";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { Builder } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { getAsset } from "../models/storage";

/**
 * Home API example.
 * @route POST /
 */
export async function index(req: Request, res: Response) {
    const status = 400;
    const file = req.file;
    const data: any[] = [];
    const output: any[] = [];

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
            output.push(["No", "Telepon", "Nama", "Region", "Area", "Status"].join(","));

            for (let index = 0; index < data.length; index++) {
                const element = data[index];             
                const options = new Options();
                let status = "Berhasil";

                options.addArguments("--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--disable-extensions");
                options.setUserPreferences({ "profile.default_content_settings.cookies": 2 });

                const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

                try {
                    await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${element.regon}&utm_campaign=${element.area}`);
                    await driver.sleep(10000);
                    await driver.executeScript("document.querySelector(\"#_evidon-banner-acceptbutton\").click()");
                    await driver.executeScript("document.querySelector(\"#pledge-button\").click()");
                    await driver.executeScript(`document.querySelector("#nama_bunda").setAttribute("value", "${element.name}")`);
                    await driver.executeScript(`document.querySelector("#nomor_tlp").setAttribute("value", "${element.mobile}")`);
                    await driver.executeScript(`document.querySelector("#instagram").setAttribute("value", "${element.name.split(" ")[0]}")`);
                    await driver.executeScript("document.querySelector(\"#agree1\").checked = true");
                    await driver.executeScript("document.querySelector(\"#agree2\").checked = true");
                    await driver.executeScript("document.querySelector(\"#certificate-gen\").disabled = false");
                    await driver.executeScript("document.querySelector(\"#certificate-gen\").click()");
                    await driver.sleep(5000);
                    driver.quit();
                } catch (error) {
                    driver.quit();

                    status = "Gagal";
                }

                output.push([index + 1, element.mobile, element.name, element.regon, element.area, status].join(","));
                console.clear();
                console.log(output.join("\n"));
            }

            res.setHeader("Content-disposition", `attachment; filename=${new Date().getTime()}.csv`);
            res.set("Content-Type", "text/csv");
            res.send(output.join("\n"));
        });
}
