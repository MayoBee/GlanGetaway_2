import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "../hooks/use-toast";
import { fetchAmenitySlots, bookAmenitySlot, cancelAmenitySlotBooking, fetchMyAmenityBookings } from "../api-client";
import { Calendar, Clock, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";

interface AmenitySlot {
  _id: string;
  amenityId: string;
  amenityName: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
  price?: number;
}

interface AmenityBooking {
  _id: string;
  amenityId: string;
  amenityName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed";
  price?: number;
  createdAt: string;
}

const AmenitySlots = () => {
  const [slots, setSlots] = useState<AmenitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenityId, setSelectedAmenityId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AmenitySlot | null>(null);
  const [numberOfParticipants, setNumberOfParticipants] = useState(1);

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      const data = await fetchMyAmenityBookings();
      setMyBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  };

  const loadSlots = async (amenityId: string, date: string) => {
    try {
      setLoading(true);
      const data = await fetchAmenitySlots(amenityId, date);
      setSlots(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load amenity slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSlots = () => {
    if (!selectedAmenityId || !selectedDate) {
      toast({
        title: "Error",
        description: "Please select amenity and date",
        variant: "destructive",
      });
      return;
    }
    loadSlots(selectedAmenityId, selectedDate);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    try {
      await bookAmenitySlot({
        amenityId: selectedSlot.amenityId,
        slotId: selectedSlot._id,
        date: selectedSlot.date,
        participants: numberOfParticipants,
      });
      toast({
        title: "Success",
        description: "Amenity slot booked successfully",
      });
      setIsBookDialogOpen(false);
      setSelectedSlot(null);
      setNumberOfParticipants(1);
      loadMyBookings();
      loadSlots(selectedAmenityId, selectedDate);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book amenity slot",
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelAmenitySlotBooking(bookingId);
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
      loadMyBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const openBookDialog = (slot: AmenitySlot) => {
    setSelectedSlot(slot);
    setNumberOfParticipants(1);
    setIsBookDialogOpen(true);
  };

  const availableSlots = slots.filter((slot) => slot.isAvailable && slot.bookedCount < slot.capacity);

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Book Amenity Slot
            </CardTitle>
            <CardDescription>
              Search and book available amenity time slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="amenityId">Amenity ID *</Label>
                <Input
                  id="amenityId"
                  value={selectedAmenityId}
                  onChange={(e) => setSelectedAmenityId(e.target.value)}
                  placeholder="Enter amenity ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <Button onClick={handleSearchSlots} className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Search Available Slots
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Search for amenity slots to see availability
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold">Available Slots ({availableSlots.length})</h3>
                {availableSlots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No available slots for this date</p>
                ) : (
                  availableSlots.map((slot) => (
                    <Card key={slot._id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{slot.amenityName}</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p>
                                Capacity: {slot.bookedCount}/{slot.capacity}
                              </p>
                              {slot.price && (
                                <p>Price: ₱{slot.price.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openBookDialog(slot)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Book
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My Bookings</CardTitle>
            <CardDescription>
              View and manage your amenity slot bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings yet
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <Card key={booking._id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{booking.amenityName}</h4>
                            <Badge variant={booking.status === "confirmed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}>
                              {booking.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(booking.date).toLocaleDateString()}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {booking.startTime} - {booking.endTime}
                            </p>
                            {booking.price && (
                              <p>Price: ₱{booking.price.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Amenity Slot</DialogTitle>
            <DialogDescription>
              Confirm your booking for this amenity slot
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold">{selectedSlot.amenityName}</h4>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedSlot.date).toLocaleDateString()}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                  <p>Available spots: {selectedSlot.capacity - selectedSlot.bookedCount}</p>
                  {selectedSlot.price && (
                    <p>Price per person: ₱{selectedSlot.price.toFixed(2)}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="participants">Number of Participants *</Label>
                <Input
                  id="participants"
                  type="number"
                  min="1"
                  max={selectedSlot.capacity - selectedSlot.bookedCount}
                  value={numberOfParticipants}
                  onChange={(e) => setNumberOfParticipants(parseInt(e.target.value))}
                />
              </div>
              {selectedSlot.price && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="font-semibold">
                    Total: ₱{(selectedSlot.price * numberOfParticipants).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookSlot}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AmenitySlots;

