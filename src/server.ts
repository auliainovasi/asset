import errorHandler from "errorhandler";
import app from "./app";
import "dotenv/config";


/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV ?? app.get("env") === "development") {
    app.use(errorHandler());
}


/**
 * Start Express server.
 */
const server = app.listen(process.env.PORT ?? app.get("port"), () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        process.env.PORT ?? app.get("port"),
        process.env.NODE_ENV ?? app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
});

export default server;
