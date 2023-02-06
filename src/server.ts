import errorHandler from "errorhandler";
import app from "./app";
import "dotenv/config";


/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
    app.use(errorHandler());
}


/**
 * Start Express server.
 */
const server = app.listen(process.env.PORT, () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        process.env.PORT,
        process.env.NODE_ENV
    );
    console.log("  Press CTRL-C to stop\n");
});

export default server;
