"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomError extends Error {
    message;
    statusCode;
    code;
    constructor({ message, statusCode, code, }) {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
    }
}
exports.default = CustomError;
