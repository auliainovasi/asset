import { parse } from "csv-parse";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { Builder, WebElement, Capabilities } from "selenium-webdriver";
import { getAsset } from "../models/storage";

/**
 * Home API example.
 * @route POST /
 */
export async function index(req: Request, res: Response) {
    const status = 400;
    const file = req.file;

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
                const chromeCapabilities = Capabilities.chrome();
                const chromeOptions = {
                    "args": [
                        "--test-type",
                        "--incognito"
                    ]
                };

                chromeCapabilities.set("chromeOptions", chromeOptions);

                const driver = await new Builder().withCapabilities(chromeCapabilities).build();

                await driver.get("chrome://settings/clearBrowserData");
                await driver.sleep(3000);

                const clearButton: WebElement = await driver.executeScript("return document.querySelector(\"body > settings-ui\").shadowRoot.querySelector(\"#main\").shadowRoot.querySelector(\"settings-basic-page\").shadowRoot.querySelector(\"#basicPage > settings-section:nth-child(9) > settings-privacy-page\").shadowRoot.querySelector(\"settings-clear-browsing-data-dialog\").shadowRoot.querySelector(\"#clearBrowsingDataConfirm\")");

                await clearButton.click();
                await driver.sleep(10000);
                // await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${row.region}&utm_campaign=${row.area}`);
                // await driver.findElement(By.name("q")).sendKeys("webdriver", Key.RETURN);
                // await driver.wait(until.titleIs("webdriver - Google Search"), 1000);

                driver.quit();
            }
        }).on("end", async () => {
            return res.sendStatus(200);
        });
}
