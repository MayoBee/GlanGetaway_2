import React, { useState, useEffect } from "react";
import { useMutationWithLoading, useQueryWithLoading } from "../hooks/useLoadingHooks";
import { axiosInstance } from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useAdminBypass } from "../hooks/useAdminBypass";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  Shield,
  ShieldOff,
  AlertCircle,
  Loader2,
  FileCheck,
  FileX,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";

interface Application {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dtiPermit: string;
  municipalEngineeringCert: string;
  municipalHealthCert: string;
  menroCert: string;
  bfpPermit: string;
  businessPermit: string;
  nationalId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: any;
  rejectionReason?: string;
}

const AdminApplicationReview = () => {
  const { showToast } = useAppContext();
  const { isAdmin } = useAdminBypass();
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{name: string, url: string} | null>(null);

  console.log('AdminApplicationReview rendering, selectedDocument:', selectedDocument, 'selectedApplication:', selectedApplication);

  const handleViewDocument = (documentType: string, filename: string) => {
    console.log('handleViewDocument called:', { documentType, filename });
    if (!filename) {
      console.error('Filename is null or undefined:', filename);
      return;
    }
    const documentUrl = `http://localhost:5000/uploads/resort-owner-applications/${filename}`;
    console.log('Setting selectedDocument to:', { name: documentType, url: documentUrl });
    setSelectedDocument({name: documentType, url: documentUrl});
    console.log('selectedDocument after setting:', { name: documentType, url: documentUrl });
  };
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch pending resort owner applications
  const fetchPendingApplications = async () => {
    const response = await axiosInstance.get("/api/resort-owner-application/all?status=pending");
    return response.data.data;
  };

  const { data: applications = [], isLoading, refetch } = useQueryWithLoading(
    "pendingApplications",
    fetchPendingApplications,
    {
      loadingMessage: "Loading applications...",
    }
  );

  // Review document mutation
  const reviewDocumentMutation = useMutationWithLoading(
    ({ applicationId, documentType, reviewed }: {applicationId: string, documentType: string, reviewed: boolean}) =>
      axiosInstance.put(`/api/role-promotion-requests/${applicationId}/review-document`, {
        documentType,
        reviewed,
        notes: adminNotes
      }),
    {
      onSuccess: () => {
        showToast({
          title: "Document Review Updated",
          description: "Document review status has been updated successfully.",
          type: "SUCCESS",
        });
        refetch();
        if (selectedApplication) {
          fetchApplicationDetails(selectedApplication._id);
        }
      },
      onError: (error: any) => {
        showToast({
          title: "Review Failed",
          description: error.message || "Failed to update document review.",
          type: "ERROR",
        });
      },
    }
  );

  // Approve application mutation
  const approveMutation = useMutationWithLoading(
    (applicationId: string) =>
      axiosInstance.post(`/api/resort-owner-application/${applicationId}/approve`),
    {
      onSuccess: (data) => {
        showToast({
          title: "Application Approved",
          description: "The resort owner application has been approved successfully.",
          type: "SUCCESS",
        });
        refetch();
        setIsDetailDialogOpen(false);
        setSelectedApplication(null);
      },
      onError: (error: any) => {
        showToast({
          title: "Error",
          description: error.response?.data?.message || "Failed to approve application",
          type: "ERROR",
        });
      },
    }
  );

  // Decline application mutation
  const declineMutation = useMutationWithLoading(
    ({ applicationId, reason }: {applicationId: string, reason: string}) =>
      axiosInstance.post(`/api/resort-owner-application/${applicationId}/decline`, {
        rejectionReason: reason
      }),
    {
      onSuccess: (data) => {
        showToast({
          title: "Application Declined",
          description: "The resort owner application has been declined.",
          type: "SUCCESS",
        });
        refetch();
        setIsDetailDialogOpen(false);
        setSelectedApplication(null);
      },
      onError: (error: any) => {
        showToast({
          title: "Error",
          description: error.response?.data?.message || "Failed to decline application",
          type: "ERROR",
        });
      },
    }
  );

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const response = await axiosInstance.get(`/api/resort-owner-application/${applicationId}`);
      setSelectedApplication(response.data.application);
    } catch (error) {
      console.error("Error fetching application details:", error);
    }
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailDialogOpen(true);
  };

  const handleReviewDocument = (documentType: string, reviewed: boolean) => {
    if (selectedApplication) {
      reviewDocumentMutation.mutate({
        applicationId: selectedApplication._id,
        documentType,
        reviewed
      });
    }
  };

  const handleApproveApplication = () => {
    if (selectedApplication) {
      approveMutation.mutate(selectedApplication._id);
    }
  };

  const handleDeclineApplication = (reason: string) => {
    if (selectedApplication) {
      declineMutation.mutate({
        applicationId: selectedApplication._id,
        reason
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "under_review":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  const getDocumentIcon = (documentType: string, reviewed: boolean) => {
    return reviewed ? <FileCheck className="w-5 h-5 text-green-600" /> : <FileX className="w-5 h-5 text-red-600" />;
  };

  const getDocumentDisplayName = (documentType: string) => {
    const names: { [key: string]: string } = {
      dtiPermit: "DTI Permit",
      municipalEngineeringCertification: "Municipal Engineering Certification",
      municipalHealthCertification: "Municipal Health Certification",
      menroCertification: "MENRO Certification",
      bfpPermit: "BFP Permit",
      businessPermit: "Business Permit",
      nationalId: "National ID"
    };
    return names[documentType] || documentType;
  };

  // All resort owner applications can be approved/declined by admins

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only Admins can access the Application Review page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-primary-600" />
              Resort Owner Applications
            </h1>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {applications.length} pending
          </Badge>
        </div>
        <p className="text-gray-600">
          Review and verify resort owner applications with their submitted documents.
        </p>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Pending Applications ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending applications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application: Application) => (
                <div
                  key={application._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {application.userId.firstName} {application.userId.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{application.userId.email}</div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        Applied {new Date(application.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(application.status)}
                    
                    <Button
                      onClick={() => handleViewApplication(application)}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Application Review - {selectedApplication?.userId.firstName} {selectedApplication?.userId.lastName}
            </DialogTitle>
            <DialogDescription>
              Review the submitted application and documents. {selectedDocument?.url ? 'Document selected for review.' : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Applicant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedApplication.userId.firstName} {selectedApplication.userId.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedApplication.userId.email}
                  </div>
                  <div>
                    <span className="font-medium">Application ID:</span> {selectedApplication._id}
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span> {new Date(selectedApplication.submittedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DTI Permit */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">DTI Permit</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewDocument("DTI Permit", selectedApplication.dtiPermit)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Municipal Engineering Certification */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Municipal Engineering Certification</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => {
                      console.log('Selected Application:', selectedApplication);
                      console.log('Municipal Engineering Cert:', selectedApplication?.municipalEngineeringCert);
                      if (selectedApplication?.municipalEngineeringCert) {
                        setSelectedDocument({name: "Municipal Engineering Certification", url: `http://localhost:5000/uploads/resort-owner-applications/${selectedApplication.municipalEngineeringCert}`});
                      } else {
                        console.error('Municipal Engineering Cert not found in application');
                      }
                    }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Municipal Health Certification */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Municipal Health Certification</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => {
                      console.log('Selected Application:', selectedApplication);
                      console.log('Municipal Health Cert:', selectedApplication?.municipalHealthCert);
                      if (selectedApplication?.municipalHealthCert) {
                        setSelectedDocument({name: "Municipal Health Certification", url: `http://localhost:5000/uploads/resort-owner-applications/${selectedApplication.municipalHealthCert}`});
                      } else {
                        console.error('Municipal Health Cert not found in application');
                      }
                    }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* MENRO Certification */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">MENRO Certification</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => {
                      console.log('Selected Application:', selectedApplication);
                      console.log('MENRO Cert:', selectedApplication?.menroCert);
                      if (selectedApplication?.menroCert) {
                        setSelectedDocument({name: "MENRO Certification", url: `http://localhost:5000/uploads/resort-owner-applications/${selectedApplication.menroCert}`});
                      } else {
                        console.error('MENRO Cert not found in application');
                      }
                    }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* BFP Permit */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">BFP Permit</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewDocument("BFP Permit", selectedApplication.bfpPermit)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Business Permit */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Business Permit</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewDocument("Business Permit", selectedApplication.businessPermit)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* National ID */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">National ID</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewDocument("National ID", selectedApplication.nationalId)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes about this application..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason:");
                    if (reason) handleDeclineApplication(reason);
                  }}
                  disabled={declineMutation.isLoading}
                >
                  {declineMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline Application
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleApproveApplication}
                  disabled={approveMutation.isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approveMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Promote
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => { console.log('Closing document dialog'); setSelectedDocument(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              {selectedDocument?.url ? 'Review the submitted document' : 'No document selected'}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
               <div className="border rounded-lg overflow-hidden">
                 {selectedDocument?.url ? (
                 <>
                   <div className="border rounded-lg overflow-hidden">
                     <img
                       src={selectedDocument.url}
                       alt={selectedDocument.name}
                       className="w-full h-auto max-h-[60vh] object-contain"
                       onError={(e) => {
                         console.error('Image failed to load:', selectedDocument.url);
                         e.currentTarget.src = '/placeholder-document.png';
                       }}
                       onLoad={() => {
                         console.log('Image loaded successfully:', selectedDocument.url);
                       }}
                     />
                   </div>
                   <div className="flex justify-end">
                     <Button
                       variant="outline"
                       onClick={() => window.open(selectedDocument.url, '_blank')}
                     >
                       <Download className="w-4 h-4 mr-2" />
                       Download
                     </Button>
                   </div>
                 </>
               ) : (
                 <div className="text-center py-8">
                   <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-600">No document selected</p>
                 </div>
               )}
               </div>
               <div className="flex justify-end">
                 <Button
                   variant="outline"
                   onClick={() => selectedDocument?.url && window.open(selectedDocument.url, '_blank')}
                 >
                   <Download className="w-4 h-4 mr-2" />
                   Download
                 </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplicationReview;
