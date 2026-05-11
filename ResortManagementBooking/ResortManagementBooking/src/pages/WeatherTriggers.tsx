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
import { Switch } from "../components/ui/switch";
import { toast } from "../hooks/use-toast";
import { fetchWeatherTriggers, createWeatherTrigger, updateWeatherTrigger, deleteWeatherTrigger, toggleWeatherTrigger } from "../api-client";
import { Plus, Pencil, Trash2, Cloud, CloudRain, Sun, Wind, Thermometer, Power, PowerOff } from "lucide-react";

interface WeatherTrigger {
  _id: string;
  hotelId?: string;
  name: string;
  description: string;
  triggerType: "rain" | "temperature" | "wind" | "storm" | "heat_wave" | "cold_wave";
  condition: {
    operator: "greater_than" | "less_than" | "equals" | "not_equals";
    value: number;
    unit: string;
  };
  action: {
    type: "notification" | "auto_cancellation" | "price_adjustment" | "restriction";
    message?: string;
    percentage?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const WeatherTriggers = () => {
  const [triggers, setTriggers] = useState<WeatherTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<WeatherTrigger | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "rain" as any,
    operator: "greater_than" as any,
    value: "",
    unit: "mm",
    actionType: "notification" as any,
    actionMessage: "",
    percentage: "",
  });

  useEffect(() => {
    loadTriggers();
  }, []);

  const loadTriggers = async () => {
    try {
      setLoading(true);
      const data = await fetchWeatherTriggers();
      setTriggers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load weather triggers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrigger = async () => {
    try {
      await createWeatherTrigger({
        name: formData.name,
        description: formData.description,
        triggerType: formData.triggerType,
        condition: {
          operator: formData.operator,
          value: parseFloat(formData.value),
          unit: formData.unit,
        },
        action: {
          type: formData.actionType,
          message: formData.actionMessage,
          percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
        },
      });
      toast({
        title: "Success",
        description: "Weather trigger created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadTriggers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create weather trigger",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTrigger = async () => {
    if (!editingTrigger) return;
    try {
      await updateWeatherTrigger(editingTrigger._id, {
        name: formData.name,
        description: formData.description,
        triggerType: formData.triggerType,
        condition: {
          operator: formData.operator,
          value: parseFloat(formData.value),
          unit: formData.unit,
        },
        action: {
          type: formData.actionType,
          message: formData.actionMessage,
          percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
        },
      });
      toast({
        title: "Success",
        description: "Weather trigger updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingTrigger(null);
      resetForm();
      loadTriggers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update weather trigger",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!confirm("Are you sure you want to delete this weather trigger?")) return;
    try {
      await deleteWeatherTrigger(triggerId);
      toast({
        title: "Success",
        description: "Weather trigger deleted successfully",
      });
      loadTriggers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete weather trigger",
        variant: "destructive",
      });
    }
  };

  const handleToggleTrigger = async (triggerId: string) => {
    try {
      await toggleWeatherTrigger(triggerId);
      toast({
        title: "Success",
        description: "Weather trigger status updated successfully",
      });
      loadTriggers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update trigger status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (trigger: WeatherTrigger) => {
    setEditingTrigger(trigger);
    setFormData({
      name: trigger.name,
      description: trigger.description,
      triggerType: trigger.triggerType,
      operator: trigger.condition.operator,
      value: trigger.condition.value.toString(),
      unit: trigger.condition.unit,
      actionType: trigger.action.type,
      actionMessage: trigger.action.message || "",
      percentage: trigger.action.percentage?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      triggerType: "rain",
      operator: "greater_than",
      value: "",
      unit: "mm",
      actionType: "notification",
      actionMessage: "",
      percentage: "",
    });
  };

  const triggerTypes = ["rain", "temperature", "wind", "storm", "heat_wave", "cold_wave"];
  const operators = ["greater_than", "less_than", "equals", "not_equals"];
  const actionTypes = ["notification", "auto_cancellation", "price_adjustment", "restriction"];

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "rain": return <CloudRain className="h-5 w-5" />;
      case "temperature": return <Thermometer className="h-5 w-5" />;
      case "wind": return <Wind className="h-5 w-5" />;
      case "storm": return <Cloud className="h-5 w-5" />;
      case "heat_wave": return <Sun className="h-5 w-5" />;
      case "cold_wave": return <Thermometer className="h-5 w-5" />;
      default: return <Cloud className="h-5 w-5" />;
    }
  };

  const getOperatorDisplay = (operator: string) => {
    switch (operator) {
      case "greater_than": return ">";
      case "less_than": return "<";
      case "equals": return "=";
      case "not_equals": return "≠";
      default: return operator;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Cloud className="h-6 w-6" />
            Weather Triggers
          </CardTitle>
          <CardDescription>
            Configure automated responses based on weather conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trigger
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Weather Trigger</DialogTitle>
                  <DialogDescription>
                    Configure an automated response to weather conditions
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Trigger Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Heavy Rain Alert"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe when this trigger should activate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="triggerType">Weather Type *</Label>
                    <Select
                      value={formData.triggerType}
                      onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operator">Condition Operator *</Label>
                    <Select
                      value={formData.operator}
                      onValueChange={(value: any) => setFormData({ ...formData, operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op} value={op}>
                            {getOperatorDisplay(op)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Threshold Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., mm, °C, km/h"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionType">Action Type *</Label>
                    <Select
                      value={formData.actionType}
                      onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Adjustment Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      step="0.01"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      placeholder="For price adjustments"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="actionMessage">Notification Message</Label>
                    <Textarea
                      id="actionMessage"
                      value={formData.actionMessage}
                      onChange={(e) => setFormData({ ...formData, actionMessage: e.target.value })}
                      placeholder="Message to send to guests"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTrigger}>Create Trigger</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading weather triggers...</div>
          ) : (
            <div className="grid gap-4">
              {triggers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No weather triggers configured
                </div>
              ) : (
                triggers.map((trigger) => (
                  <Card key={trigger._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTriggerIcon(trigger.triggerType)}
                            <h3 className="font-semibold text-lg">{trigger.name}</h3>
                            <Badge variant={trigger.isActive ? "default" : "secondary"}>
                              {trigger.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{trigger.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <strong>Condition:</strong> {getOperatorDisplay(trigger.condition.operator)} {trigger.condition.value} {trigger.condition.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <strong>Action:</strong> {trigger.action.type.replace(/_/g, " ").toUpperCase()}
                            </span>
                            {trigger.action.percentage && (
                              <span className="flex items-center gap-1">
                                <strong>Adjustment:</strong> {trigger.action.percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleTrigger(trigger._id)}
                          >
                            {trigger.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(trigger)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTrigger(trigger._id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Weather Trigger</DialogTitle>
            <DialogDescription>
              Update weather trigger configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-name">Trigger Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-triggerType">Weather Type *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-operator">Condition Operator *</Label>
              <Select
                value={formData.operator}
                onValueChange={(value: any) => setFormData({ ...formData, operator: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {getOperatorDisplay(op)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Threshold Value *</Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unit *</Label>
              <Input
                id="edit-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-actionType">Action Type *</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-percentage">Adjustment Percentage (%)</Label>
              <Input
                id="edit-percentage"
                type="number"
                step="0.01"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-actionMessage">Notification Message</Label>
              <Textarea
                id="edit-actionMessage"
                value={formData.actionMessage}
                onChange={(e) => setFormData({ ...formData, actionMessage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrigger}>Update Trigger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeatherTriggers;

