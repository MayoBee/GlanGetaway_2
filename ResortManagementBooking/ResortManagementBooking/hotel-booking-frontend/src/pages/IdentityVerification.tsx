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
import { fetchIdentityVerifications, verifyPWD, verifyAccount, fetchVerificationDocuments, reviewVerificationDocument } from "../api-client";
import { CheckCircle, XCircle, Shield, FileText, Search, Eye } from "lucide-react";

interface UserVerification {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  isPWD?: boolean;
  pwdId?: string;
  pwdIdVerified?: boolean;
  pwdVerifiedBy?: string;
  pwdVerifiedAt?: string;
  accountVerified?: boolean;
  accountVerifiedBy?: string;
  accountVerifiedAt?: string;
  birthdate?: string;
  createdAt: string;
}

interface VerificationDocument {
  _id: string;
  userId: string;
  documentType: "pwd_id" | "government_id" | "proof_of_address" | "other";
  documentUrl?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const IdentityVerification = () => {
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserVerification | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifyType, setVerifyType] = useState<"pwd" | "account">("pwd");

  useEffect(() => {
    loadVerifications();
    loadDocuments();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await fetchIdentityVerifications(statusFilter, typeFilter);
      setVerifications(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load identity verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await fetchVerificationDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleVerifyPWD = async () => {
    if (!selectedUser) return;
    try {
      await verifyPWD(selectedUser.userId, {
        notes: verifyNotes,
      });
      toast({
        title: "Success",
        description: "PWD verification completed successfully",
      });
      setIsVerifyDialogOpen(false);
      setSelectedUser(null);
      setVerifyNotes("");
      loadVerifications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify PWD",
        variant: "destructive",
      });
    }
  };

  const handleVerifyAccount = async () => {
    if (!selectedUser) return;
    try {
      await verifyAccount(selectedUser.userId, {
        notes: verifyNotes,
      });
      toast({
        title: "Success",
        description: "Account verification completed successfully",
      });
      setIsVerifyDialogOpen(false);
      setSelectedUser(null);
      setVerifyNotes("");
      loadVerifications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify account",
        variant: "destructive",
      });
    }
  };

  const handleReviewDocument = async (documentId: string, approved: boolean, notes?: string) => {
    try {
      await reviewVerificationDocument(documentId, {
        status: approved ? "approved" : "rejected",
        rejectionReason: approved ? undefined : notes,
      });
      toast({
        title: "Success",
        description: `Document ${approved ? "approved" : "rejected"} successfully`,
      });
      loadDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to review document",
        variant: "destructive",
      });
    }
  };

  const openVerifyDialog = (user: UserVerification, type: "pwd" | "account") => {
    setSelectedUser(user);
    setVerifyType(type);
    setVerifyNotes("");
    setIsVerifyDialogOpen(true);
  };

  const openDocumentDialog = (user: UserVerification) => {
    setSelectedUser(user);
    setIsDocumentDialogOpen(true);
  };

  const getUserDocuments = (userId: string) => {
    return documents.filter((doc) => doc.userId === userId);
  };

  const filteredVerifications = verifications.filter((verification) => {
    const matchesSearch =
      `${verification.firstName} ${verification.lastName} ${verification.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const verificationStatus = (user: UserVerification) => {
    if (user.accountVerified && user.pwdIdVerified) return "fully_verified";
    if (user.accountVerified) return "account_verified";
    if (user.pwdIdVerified) return "pwd_verified";
    return "unverified";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fully_verified": return "default";
      case "account_verified": return "secondary";
      case "pwd_verified": return "secondary";
      case "unverified": return "outline";
      default: return "outline";
    }
  };

  const getStatusBadge = (verified?: boolean) => {
    if (verified === true) {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
    } else if (verified === false) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
    return <Badge variant="outline">Not Applicable</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Identity Verification
          </CardTitle>
          <CardDescription>
            Verify PWD IDs and user accounts for discount eligibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="fully_verified">Fully Verified</SelectItem>
                <SelectItem value="account_verified">Account Only</SelectItem>
                <SelectItem value="pwd_verified">PWD Only</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading verifications...</div>
          ) : (
            <div className="grid gap-4">
              {filteredVerifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No verification requests found
                </div>
              ) : (
                filteredVerifications.map((user) => (
                  <Card key={user._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {user.firstName} {user.lastName}
                            </h3>
                            <Badge variant={getStatusColor(verificationStatus(user))}>
                              {verificationStatus(user).replace(/_/g, " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="font-medium">PWD Status:</span>
                              <div>{getStatusBadge(user.pwdIdVerified)}</div>
                              {user.pwdId && <p className="text-muted-foreground">ID: {user.pwdId}</p>}
                              {user.pwdVerifiedAt && (
                                <p className="text-muted-foreground">
                                  Verified: {new Date(user.pwdVerifiedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <span className="font-medium">Account Status:</span>
                              <div>{getStatusBadge(user.accountVerified)}</div>
                              {user.accountVerifiedAt && (
                                <p className="text-muted-foreground">
                                  Verified: {new Date(user.accountVerifiedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {!user.pwdIdVerified && user.isPWD && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVerifyDialog(user, "pwd")}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Verify PWD
                              </Button>
                            )}
                            {!user.accountVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVerifyDialog(user, "account")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify Account
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDocumentDialog(user)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Documents
                            </Button>
                          </div>
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

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyType === "pwd" ? "Verify PWD ID" : "Verify Account"}
            </DialogTitle>
            <DialogDescription>
              {verifyType === "pwd"
                ? "Verify this user's PWD identification for discount eligibility"
                : "Verify this user's account"}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                {verifyType === "pwd" && selectedUser.pwdId && (
                  <p className="text-sm mt-2">
                    <strong>PWD ID:</strong> {selectedUser.pwdId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Verification Notes</Label>
                <Textarea
                  id="notes"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={verifyType === "pwd" ? handleVerifyPWD : handleVerifyAccount}>
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Documents</DialogTitle>
            <DialogDescription>
              Review uploaded verification documents
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="space-y-3">
                {getUserDocuments(selectedUser.userId).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No documents uploaded
                  </p>
                ) : (
                  getUserDocuments(selectedUser.userId).map((doc) => (
                    <Card key={doc._id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{doc.documentType.replace(/_/g, " ").toUpperCase()}</span>
                              <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                                {doc.status.toUpperCase()}
                              </Badge>
                            </div>
                            {doc.documentUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(doc.documentUrl, "_blank")}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Document
                              </Button>
                            )}
                            {doc.rejectionReason && (
                              <p className="text-sm text-destructive mt-2">
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                          {doc.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReviewDocument(doc._id, true)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const reason = prompt("Enter rejection reason:");
                                  if (reason) handleReviewDocument(doc._id, false, reason);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IdentityVerification;

