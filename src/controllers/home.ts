/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "csv-parse";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { Builder, WebElement, By } from "selenium-webdriver";
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
            for (const iterator of data) {
                const options = new Options();

                options.addArguments("--disable-blink-features=AutomationControlled");
                options.addArguments("--disable-extensions");

                const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

                await driver.get("chrome://settings/clearBrowserData");
                await driver.sleep(1000);

                const clearButton: WebElement = await driver.executeScript("return document.querySelector(\"body > settings-ui\").shadowRoot.querySelector(\"#main\").shadowRoot.querySelector(\"settings-basic-page\").shadowRoot.querySelector(\"#basicPage > settings-section:nth-child(9) > settings-privacy-page\").shadowRoot.querySelector(\"settings-clear-browsing-data-dialog\").shadowRoot.querySelector(\"#clearBrowsingDataConfirm\")");

                await clearButton.click();
                await driver.sleep(5000);
                await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${iterator.regon}&utm_campaign=${iterator.area}`);
                await driver.sleep(10000);

                const aggrementButton = await driver.findElement(By.id("_evidon-banner-acceptbutton"));
                const formModal = await driver.findElement(By.id("pledge-button"));

                await aggrementButton.click();
                await formModal.click();
                await driver.executeScript(`document.querySelector("#nama_bunda").setAttribute("value", "${iterator.name}")`);
                await driver.executeScript(`document.querySelector("#nomor_tlp").setAttribute("value", "${iterator.mobile}")`);
                await driver.executeScript(`document.querySelector("#instagram").setAttribute("value", "${iterator.name.split(" ")[0]}")`);
                await driver.executeScript("document.querySelector(\"#agree1\").checked = true");
                await driver.executeScript("document.querySelector(\"#agree2\").checked = true");
                await driver.executeScript("document.querySelector(\"#certificate-gen\").disabled = false");
                await driver.executeScript("document.querySelector(\"#certificate-gen\").click()");

                await driver.sleep(10000);
                // driver.quit();
            }

            return res.sendStatus(200);
        });
}
