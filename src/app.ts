import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import multer from "multer";
import cors from "cors";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import { getAsset } from "./models/storage";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use(cors({
    origin: "*"
}));
app.disable("x-powered-by");

/**
 * Primary app routes.
 */
app.get("/:id", homeController.get);
app.post("/", multer({dest: getAsset()}).single("file"), homeController.post);

export default app;
