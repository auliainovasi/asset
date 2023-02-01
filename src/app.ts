import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";
import multer from "multer";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as storage from "./models/storage";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.disable("x-powered-by");

/**
 * API examples routes.
 */
app.post("/", multer({dest: storage.getAsset()}).single("file"), homeController.index);

export default app;
