import { Request, Response, NextFunction } from "express";
import Hotel from "../models/hotel";
import ResortStaffAssignment from "../models/ResortStaffAssignment";

export interface AuthRequest extends Request {
  userId: string;
  user?: any;
}

// Check if user is resort owner of the resort
export const requireResortOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Access denied. User not authenticated." });
    }

    const hotelId = req.params.hotelId || req.body.hotelId || req.params.id;
    
    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required." });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (hotel.userId !== req.userId) {
      return res.status(403).json({ 
        message: "Access denied. You do not own this resort.",
        current: req.userId,
        owner: hotel.userId
      });
    }

    req.user = { ...req.user, hotel };
    next();
  } catch (error) {
    console.error("Resort ownership verification error:", error);
    return res.status(500).json({ message: "Server error during ownership verification." });
  }
};

// Check if user is front desk assigned to the resort
export const requireFrontDeskAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Access denied. User not authenticated." });
    }

    const hotelId = req.params.hotelId || req.body.hotelId || req.params.id;
    
    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required." });
    }

    const assignment = await ResortStaffAssignment.findOne({
      resortId: hotelId,
      staffUserId: req.userId,
      isActive: true,
    });

    if (!assignment) {
      return res.status(403).json({ 
        message: "Access denied. You are not assigned to this resort.",
        current: req.userId,
        hotelId
      });
    }

    req.user = { ...req.user, assignment };
    next();
  } catch (error) {
    console.error("Front desk access verification error:", error);
    return res.status(500).json({ message: "Server error during access verification." });
  }
};

// Combined check for resort owner OR assigned front desk
export const requireResortAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Access denied. User not authenticated." });
    }

    const hotelId = req.params.hotelId || req.body.hotelId || req.params.id;
    
    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required." });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    // Check if user is the owner
    if (hotel.userId === req.userId) {
      req.user = { ...req.user, hotel, accessType: 'owner' };
      return next();
    }

    // Check if user is assigned front desk staff
    const assignment = await ResortStaffAssignment.findOne({
      resortId: hotelId,
      staffUserId: req.userId,
      isActive: true,
    });

    if (assignment) {
      req.user = { ...req.user, hotel, assignment, accessType: 'front_desk' };
      return next();
    }

    return res.status(403).json({ 
      message: "Access denied. You must be the resort owner or assigned staff.",
      current: req.userId,
      hotelId
    });
  } catch (error) {
    console.error("Resort access verification error:", error);
    return res.status(500).json({ message: "Server error during access verification." });
  }
};

// Validate that resortIds belong to the current owner
export const validateResortOwnership = async (resortIds: string[], ownerUserId: string): Promise<{ valid: boolean; invalidIds?: string[] }> => {
  try {
    const hotels = await Hotel.find({ _id: { $in: resortIds } });
    const ownedHotelIds = hotels
      .filter(h => h.userId === ownerUserId)
      .map(h => h._id.toString());
    
    const invalidIds = resortIds.filter(id => !ownedHotelIds.includes(id));
    
    return {
      valid: invalidIds.length === 0,
      invalidIds: invalidIds.length > 0 ? invalidIds : undefined,
    };
  } catch (error) {
    console.error("Resort ownership validation error:", error);
    return { valid: false };
  }
};
