"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProcessErrorHandlers = exports.errorHandler = exports.asyncHandler = exports.AppError = void 0;
const crypto_1 = require("crypto");
// Custom AppError class for typed errors
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    withDetails(details) {
        this.details = details;
        return this;
    }
}
exports.AppError = AppError;
// Async route wrapper to catch all errors in async handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Global error handling middleware - MUST have 4 parameters
const errorHandler = (err, req, res, next) => {
    const correlationId = (0, crypto_1.randomUUID)();
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    // Handle known AppErrors
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.code;
        message = err.message;
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = err.message;
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Authentication token has expired';
    }
    // Handle MongoDB duplicate key errors
    else if (err.code === 11000) {
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'Duplicate resource entry';
    }
    // Handle Cast errors (invalid ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        message = 'Invalid resource identifier';
    }
    // Handle Syntax errors (invalid JSON)
    else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = 400;
        errorCode = 'INVALID_JSON';
        message = 'Invalid JSON payload';
    }
    // Handle multer file upload errors
    else if (err.name === 'MulterError') {
        statusCode = 400;
        errorCode = 'FILE_UPLOAD_ERROR';
        message = err.message;
    }
    // Log error with full context
    console.error(`[${timestamp}] [ERROR] [${correlationId}] ${err.message}`);
    console.error(`  Path: ${req.method} ${req.path}`);
    console.error(`  Status: ${statusCode} | Code: ${errorCode}`);
    if (!isProduction) {
        console.error(err.stack);
    }
    // Build response
    const response = {
        success: false,
        error: {
            message,
            code: errorCode,
            statusCode,
            correlationId,
            timestamp,
            path: req.path,
            method: req.method,
            details: err.details,
        },
    };
    // Add stack trace only in development
    if (!isProduction) {
        response.error.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Process level unhandled error handlers (prevent server crash)
const setupProcessErrorHandlers = () => {
    process.on('uncaughtException', (error) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [FATAL] Uncaught Exception:`, error.message);
        console.error(error.stack);
        // Do NOT exit process - let the server continue running
        // Only exit on truly unrecoverable errors
        if (!(error instanceof AppError) || !error.isOperational) {
            // Graceful exit after 1 second for critical errors
            setTimeout(() => process.exit(1), 1000);
        }
    });
    process.on('unhandledRejection', (reason, promise) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] Unhandled Rejection at:`, promise);
        if (reason instanceof Error) {
            console.error(`Reason: ${reason.message}`);
            console.error(reason.stack);
        }
        else {
            console.error('Reason:', reason);
        }
        // Do NOT crash server for unhandled promise rejections
    });
};
exports.setupProcessErrorHandlers = setupProcessErrorHandlers;
