import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";

// Controllers (route handlers)
import mediaController from "./controllers/media";
import webhookController from "./controllers/webhook";
import assetController from "./controllers/asset";

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
 * Primary app routes.
 */
app.get("/media/:mediaId", mediaController);
app.post("/webhook", webhookController);
app.get("/assets/:id", assetController);

export default app;
