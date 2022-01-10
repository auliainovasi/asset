import { Endpoint, S3 } from "aws-sdk";

export default new S3({
    endpoint: new Endpoint(
        "https://ap-south-1.linodeobjects.com"
    ),
    region: "ap-south-1",
    accessKeyId: "NHC2PXBAXKY0OY5TN5VO",
    secretAccessKey: "1ESx1eK2X8s2DzmtpjEHoz9AVeKYtd9jJhdftX2B"
});
