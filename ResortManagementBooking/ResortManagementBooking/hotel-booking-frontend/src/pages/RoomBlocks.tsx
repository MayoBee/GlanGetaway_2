import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";
import { fetchRoomBlocks, createRoomBlock, updateRoomBlock, deleteRoomBlock } from "../api-client";
import { Plus, Pencil, Trash2, Lock, Calendar, MapPin } from "lucide-react";

interface RoomBlock {
  _id: string;
  hotelId: string;
  roomId?: string;
  roomNumber?: string;
  startDate: string;
  endDate: string;
  reason: string;
  blockedBy: string;
  createdAt: string;
  updatedAt: string;
}

const RoomBlocks = () => {
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoomBlock | null>(null);
  const [formData, setFormData] = useState({
    hotelId: "",
    roomId: "",
    roomNumber: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await fetchRoomBlocks();
      setBlocks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load room blocks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async () => {
    try {
      await createRoomBlock({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      toast({
        title: "Success",
        description: "Room block created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadBlocks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room block",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock) return;
    try {
      await updateRoomBlock(editingBlock._id, {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      toast({
        title: "Success",
        description: "Room block updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingBlock(null);
      resetForm();
      loadBlocks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room block",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Are you sure you want to remove this room block?")) return;
    try {
      await deleteRoomBlock(blockId);
      toast({
        title: "Success",
        description: "Room block removed successfully",
      });
      loadBlocks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove room block",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (block: RoomBlock) => {
    setEditingBlock(block);
    setFormData({
      hotelId: block.hotelId,
      roomId: block.roomId || "",
      roomNumber: block.roomNumber || "",
      startDate: block.startDate.split('T')[0],
      endDate: block.endDate.split('T')[0],
      reason: block.reason,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      hotelId: "",
      roomId: "",
      roomNumber: "",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const isActiveBlock = (block: RoomBlock) => {
    const now = new Date();
    const start = new Date(block.startDate);
    const end = new Date(block.endDate);
    return now >= start && now <= end;
  };

  const isUpcomingBlock = (block: RoomBlock) => {
    const now = new Date();
    const start = new Date(block.startDate);
    return now < start;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Room Blocks
          </CardTitle>
          <CardDescription>
            Manage room availability blocks for maintenance, events, or other reasons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Block Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Block Room</DialogTitle>
                  <DialogDescription>
                    Temporarily block a room from being booked
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotelId">Hotel ID *</Label>
                    <Input
                      id="hotelId"
                      value={formData.hotelId}
                      onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                      placeholder="Enter hotel ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                      id="roomId"
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      placeholder="Enter room ID (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 101, Suite A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g., Maintenance, Private Event, Renovation"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddBlock}>Block Room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading room blocks...</div>
          ) : (
            <div className="grid gap-4">
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No room blocks configured
                </div>
              ) : (
                blocks.map((block) => (
                  <Card key={block._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-5 w-5" />
                            <h3 className="font-semibold text-lg">
                              {block.roomNumber || `Room ${block.roomId || "All"}`}
                            </h3>
                            {isActiveBlock(block) && (
                              <Badge variant="destructive">Active</Badge>
                            )}
                            {isUpcomingBlock(block) && (
                              <Badge variant="secondary">Upcoming</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(block.startDate).toLocaleDateString()} - {new Date(block.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{block.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(block)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBlock(block._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Block</DialogTitle>
            <DialogDescription>
              Update room block details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hotelId">Hotel ID *</Label>
              <Input
                id="edit-hotelId"
                value={formData.hotelId}
                onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roomId">Room ID</Label>
              <Input
                id="edit-roomId"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roomNumber">Room Number</Label>
              <Input
                id="edit-roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason *</Label>
              <Textarea
                id="edit-reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBlock}>Update Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomBlocks;

