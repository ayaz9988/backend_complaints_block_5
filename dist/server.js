"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const v1_1 = __importDefault(require("./routes/v1"));
const error_handler_1 = __importDefault(require("./middleware/error-handler"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const createServer = () => {
    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
    const app = (0, express_1.default)();
    app
        .disable("x-powered-by")
        .use((0, morgan_1.default)("dev"))
        .use(express_1.default.urlencoded({ extended: true }))
        .use(express_1.default.json())
        .use((0, cors_1.default)())
        .use((0, cors_1.default)({ origin: FRONTEND_ORIGIN, credentials: true }))
        .use((0, cookie_parser_1.default)());
    app.get("/health", (req, res) => {
        res.json({ ok: true, environment: config_1.default.env });
    });
    app.use("/v1", v1_1.default);
    app.use(error_handler_1.default);
    return app;
};
exports.createServer = createServer;
