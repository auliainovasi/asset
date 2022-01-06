function convertTZ(date: string|Date) {
    return new Date((typeof date == "string"? new Date(date): date).toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
}

export function getNow() {
    return convertTZ(new Date());
}
