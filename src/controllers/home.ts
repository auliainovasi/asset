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
            output.push(["Telepon", "Nama", "Region", "Area", "Status"].join(","));

            for (let index = 0; index < data.length; index++) {
                const element = data[index];             
                const options = new Options();
                let status = "Berhasil";

                console.log(index + 1);
                console.log(element);
                options.addArguments("--disable-blink-features=AutomationControlled");
                options.addArguments("--disable-extensions");

                const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

                try {
                    await driver.get("chrome://settings/clearBrowserData");
                    await driver.sleep(2000);

                    const clearButton: WebElement = await driver.executeScript("return document.querySelector(\"body > settings-ui\").shadowRoot.querySelector(\"#main\").shadowRoot.querySelector(\"settings-basic-page\").shadowRoot.querySelector(\"#basicPage > settings-section:nth-child(9) > settings-privacy-page\").shadowRoot.querySelector(\"settings-clear-browsing-data-dialog\").shadowRoot.querySelector(\"#clearBrowsingDataConfirm\")");

                    await clearButton.click();
                    await driver.sleep(5000);
                    await driver.get(`${process.env.WEB_HOST}?utm_source=community&utm_medium=${element.regon}&utm_campaign=${element.area}`);
                    await driver.sleep(10000);

                    const aggrementButton = await driver.findElement(By.id("_evidon-banner-acceptbutton"));
                    const formModal = await driver.findElement(By.id("pledge-button"));

                    await aggrementButton.click();
                    await formModal.click();
                    await driver.executeScript(`document.querySelector("#nama_bunda").setAttribute("value", "${element.name}")`);
                    await driver.executeScript(`document.querySelector("#nomor_tlp").setAttribute("value", "${element.mobile}")`);
                    await driver.executeScript(`document.querySelector("#instagram").setAttribute("value", "${element.name.split(" ")[0]}")`);
                    await driver.executeScript("document.querySelector(\"#agree1\").checked = true");
                    await driver.executeScript("document.querySelector(\"#agree2\").checked = true");
                    await driver.executeScript("document.querySelector(\"#certificate-gen\").disabled = false");
                    await driver.executeScript("document.querySelector(\"#certificate-gen\").click()");
                    await driver.sleep(8000);
                    driver.quit();
                } catch (error) {
                    driver.quit();

                    status = "Gagal";
                }

                output.push([element.mobile, element.name, element.regon, element.area, status].join(","));
            }

            res.setHeader("Content-disposition", `attachment; filename=${new Date().getTime()}.csv`);
            res.set("Content-Type", "text/csv");
            res.send(output.join("\n"));
        });
}
