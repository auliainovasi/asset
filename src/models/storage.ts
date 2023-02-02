import { resolve } from "path";

export function getAsset(filename = "") {
    return resolve(`src/public/${filename}`);
}
