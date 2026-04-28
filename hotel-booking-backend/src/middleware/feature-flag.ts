import { Request, Response, NextFunction } from "express";
import FeatureFlagService from "../services/feature-flags";

declare global {
  namespace Express {
    interface Request {
      featureFlags: Record<string, boolean>;
    }
  }
}

export const featureFlagMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const context = {
    userId: (req as any).user?._id?.toString(),
    userRole: (req as any).user?.role,
    userEmail: (req as any).user?.email,
    environment: process.env.NODE_ENV,
  };

  req.featureFlags = await FeatureFlagService.getAllFlags(context);
  next();
};

export const requireFeatureFlag = (flagKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = {
      userId: (req as any).user?._id?.toString(),
      userRole: (req as any).user?.role,
      userEmail: (req as any).user?.email,
      environment: process.env.NODE_ENV,
    };

    const isEnabled = await FeatureFlagService.isEnabled(flagKey, context);

    if (!isEnabled) {
      return res.status(403).json({
        success: false,
        message: "This feature is currently unavailable",
        error: "FEATURE_DISABLED",
      });
    }

    next();
  };
};

export const featureFlagRoute = (flagKey: string, enabledHandler: any, disabledHandler?: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = {
      userId: (req as any).user?._id?.toString(),
      userRole: (req as any).user?.role,
      userEmail: (req as any).user?.email,
      environment: process.env.NODE_ENV,
    };

    const isEnabled = await FeatureFlagService.isEnabled(flagKey, context);

    if (isEnabled) {
      return enabledHandler(req, res, next);
    } else if (disabledHandler) {
      return disabledHandler(req, res, next);
    }

    next();
  };
};
