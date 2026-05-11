import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware to validate request using express-validator chains
 * Throws standardized AppError with validation errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors consistently
    const formattedErrors = errors.array().map(err => ({
      field: 'path' in err ? err.path : 'param' in err ? err.param : 'unknown',
      message: err.msg,
      location: 'location' in err ? err.location : 'body'
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR'
    ).withDetails({ errors: formattedErrors });
  };
};

// Extend AppError with details support
declare module './errorHandler' {
  interface AppError {
    details?: any;
    withDetails(details: any): AppError;
  }
}

AppError.prototype.withDetails = function(details: any) {
  (this as any).details = details;
  return this;
};
