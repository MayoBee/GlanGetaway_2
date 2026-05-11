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
import { fetchFeatureFlags, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag, toggleFeatureFlag } from "../api-client";
import { Plus, Pencil, Trash2, Power, PowerOff, Flag, CheckCircle, XCircle } from "lucide-react";

interface FeatureFlag {
  _id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  environment: "development" | "staging" | "production";
  allowlist?: string[];
  createdAt: string;
  updatedAt: string;
}

const FeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    rolloutPercentage: 100,
    environment: "production" as "development" | "staging" | "production",
    allowlist: "",
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await fetchFeatureFlags();
      setFlags(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlag = async () => {
    try {
      await createFeatureFlag({
        ...formData,
        key: formData.key.toLowerCase().replace(/\s+/g, "_"),
        allowlist: formData.allowlist ? formData.allowlist.split(",").map(s => s.trim()) : [],
      });
      toast({
        title: "Success",
        description: "Feature flag created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadFlags();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create feature flag",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFlag = async () => {
    if (!editingFlag) return;
    try {
      await updateFeatureFlag(editingFlag._id, {
        ...formData,
        key: formData.key.toLowerCase().replace(/\s+/g, "_"),
        allowlist: formData.allowlist ? formData.allowlist.split(",").map(s => s.trim()) : [],
      });
      toast({
        title: "Success",
        description: "Feature flag updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingFlag(null);
      resetForm();
      loadFlags();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFlag = async (flagId: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;
    try {
      await deleteFeatureFlag(flagId);
      toast({
        title: "Success",
        description: "Feature flag deleted successfully",
      });
      loadFlags();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature flag",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlag = async (flagId: string) => {
    try {
      await toggleFeatureFlag(flagId);
      toast({
        title: "Success",
        description: "Feature flag status updated successfully",
      });
      loadFlags();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flag status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      name: flag.name,
      key: flag.key,
      description: flag.description,
      rolloutPercentage: flag.rolloutPercentage,
      environment: flag.environment,
      allowlist: flag.allowlist ? flag.allowlist.join(", ") : "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      key: "",
      description: "",
      rolloutPercentage: 100,
      environment: "production",
      allowlist: "",
    });
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesEnvironment = environmentFilter === "all" || flag.environment === environmentFilter;
    return matchesEnvironment;
  });

  const environments = ["development", "staging", "production"];

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "production": return "default";
      case "staging": return "secondary";
      case "development": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Manage feature rollouts and A/B testing configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {environments.map((env) => (
                  <SelectItem key={env} value={env}>
                    {env.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Flag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                  <DialogDescription>
                    Create a new feature flag for controlled rollouts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Flag Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., New Booking Flow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key">Flag Key *</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="e.g., new_booking_flow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this flag controls"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment *</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value: any) => setFormData({ ...formData, environment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {environments.map((env) => (
                          <SelectItem key={env} value={env}>
                            {env.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rolloutPercentage">Rollout Percentage (%) *</Label>
                    <Input
                      id="rolloutPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rolloutPercentage}
                      onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowlist">Allowlist (comma-separated user IDs)</Label>
                    <Textarea
                      id="allowlist"
                      value={formData.allowlist}
                      onChange={(e) => setFormData({ ...formData, allowlist: e.target.value })}
                      placeholder="user1, user2, user3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddFlag}>Create Flag</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading feature flags...</div>
          ) : (
            <div className="grid gap-4">
              {filteredFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feature flags found
                </div>
              ) : (
                filteredFlags.map((flag) => (
                  <Card key={flag._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{flag.name}</h3>
                            <Badge variant={getEnvironmentColor(flag.environment)}>
                              {flag.environment.toUpperCase()}
                            </Badge>
                            <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                              {flag.isEnabled ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Enabled</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Disabled</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <code className="bg-muted px-2 py-1 rounded">{flag.key}</code>
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">{flag.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <strong>Rollout:</strong> {flag.rolloutPercentage}%
                            </span>
                            {flag.allowlist && flag.allowlist.length > 0 && (
                              <span className="flex items-center gap-1">
                                <strong>Allowlist:</strong> {flag.allowlist.length} users
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFlag(flag._id)}
                          >
                            {flag.isEnabled ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(flag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFlag(flag._id)}
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
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update feature flag configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Flag Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-key">Flag Key *</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-environment">Environment *</Label>
              <Select
                value={formData.environment}
                onValueChange={(value: any) => setFormData({ ...formData, environment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env} value={env}>
                      {env.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rolloutPercentage">Rollout Percentage (%) *</Label>
              <Input
                id="edit-rolloutPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-allowlist">Allowlist (comma-separated user IDs)</Label>
              <Textarea
                id="edit-allowlist"
                value={formData.allowlist}
                onChange={(e) => setFormData({ ...formData, allowlist: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFlag}>Update Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureFlags;

