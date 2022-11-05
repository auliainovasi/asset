import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import errorHandler from "errorhandler";
import app from "./app";
import "dotenv/config";


/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
    app.use(errorHandler());
} else {
    Sentry.init({
        dsn: "https://457606566ada4d258e694abe99caf58a@o1106728.ingest.sentry.io/4504105480552448",
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Tracing.Integrations.Express({ app }),
        ],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
}


/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
});

export default server;
