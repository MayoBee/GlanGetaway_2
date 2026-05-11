"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware to validate request using express-validator chains
 * Throws standardized AppError with validation errors
 */
const validate = (validations) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Run all validations
        yield Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        // Format validation errors consistently
        const formattedErrors = errors.array().map(err => ({
            field: 'path' in err ? err.path : 'param' in err ? err.param : 'unknown',
            message: err.msg,
            location: 'location' in err ? err.location : 'body'
        }));
        throw new errorHandler_1.AppError('Validation failed', 400, 'VALIDATION_ERROR').withDetails({ errors: formattedErrors });
    });
};
exports.validate = validate;
errorHandler_1.AppError.prototype.withDetails = function (details) {
    this.details = details;
    return this;
};
