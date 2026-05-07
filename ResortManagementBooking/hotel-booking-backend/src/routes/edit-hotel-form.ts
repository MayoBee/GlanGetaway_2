import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import verifyToken from "../middleware/auth";

const router = express.Router();

// Helper function to get hotel by ID
async function getHotelById(hotelId: string) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new Error("Hotel not found");
  }
  return hotel;
}

// Helper function to update hotel with included entrance fees
async function updateHotelEntranceFees(hotelId: string, entranceFeeData: any) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new Error("Hotel not found");
  }

  // Update rooms with included entrance fees
  if (entranceFeeData.rooms) {
    hotel.rooms = hotel.rooms?.map((room: any) => ({
      ...room,
      includedEntranceFee: {
        enabled: entranceFeeData.rooms.enabled || false,
        adultCount: entranceFeeData.rooms.adultCount || 0,
        childCount: entranceFeeData.rooms.childCount || 0,
      }
    }));
  }

  // Update cottages with included entrance fees
  if (entranceFeeData.cottages) {
    hotel.cottages = hotel.cottages?.map((cottage: any) => ({
      ...cottage,
      includedEntranceFee: {
        enabled: entranceFeeData.cottages.enabled || false,
        adultCount: entranceFeeData.cottages.adultCount || 0,
        childCount: entranceFeeData.cottages.childCount || 0,
      }
    }));
  }

  // Update last modified timestamp
  hotel.lastUpdated = new Date();

  await hotel.save();
  return hotel;
}

// PUT /edit-hotel/:hotelId
router.put("/:hotelId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const entranceFeeData = req.body;

    // Validate entrance fee data
    if (entranceFeeData) {
      // Validate rooms data
      if (entranceFeeData.rooms) {
        if (typeof entranceFeeData.rooms.enabled !== 'boolean' ||
            typeof entranceFeeData.rooms.adultCount !== 'number' ||
            typeof entranceFeeData.rooms.childCount !== 'number') {
          return res.status(400).json({ error: "Invalid rooms entrance fee data format" });
        }
      }

      // Validate cottages data
      if (entranceFeeData.cottages) {
        if (typeof entranceFeeData.cottages.enabled !== 'boolean' ||
            typeof entranceFeeData.cottages.adultCount !== 'number' ||
            typeof entranceFeeData.cottages.childCount !== 'number') {
          return res.status(400).json({ error: "Invalid cottages entrance fee data format" });
        }
      }
    }

    const updatedHotel = await updateHotelEntranceFees(hotelId, entranceFeeData);
    
    res.json({
      success: true,
      message: "Hotel entrance fees updated successfully",
      hotel: updatedHotel
    });

  } catch (error) {
    console.error("Error updating hotel entrance fees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
