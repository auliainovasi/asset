import axios from "axios";
import formData from "form-data";

export async function hitWeb(region: string, area: string) {
    const instance = axios.create({
        headers: {
          "cache-control": "no-cache"
        }
    });

    return await instance.get(`https://www.dancow.co.id/dpc/akudankausukadancow?utm_source=community&utm_medium=${region}&utm_campaign=${area}`);
}

export async function insertPetition(name: string, mobileNumber: string, sosialMedia: string) {
    const data = new formData();

    data.append("nama_bunda", name);
    data.append("nomor_tlp", mobileNumber);
    data.append("instagram", sosialMedia);
    return await axios.post(
        "https://www.dancow.co.id/petisiduajuta/addPetition",
        data,
        {
            headers: {
                "cache-control": "no-cache",
                ...data.getHeaders()
            }
        }
    );
}

export async function insertPetitionCount() {
    return await axios.post(
        "https://www.dancow.co.id/petisiduajuta/pledgeCount",
        {
            subtotal: 1
        },
        {
            headers: {
                "cache-control": "no-cache"
            }
        }
    );
}
