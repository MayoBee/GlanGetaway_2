import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import {
  FileText,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  File,
  Image as ImageIcon,
  ExternalLink,
  User,
  Mail,
  Badge,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Badge as UIBadge } from "../../../shared/ui/badge";
import { Separator } from "../../../shared/ui/separator";

type ApplicationStatus = "pending" | "approved" | "declined" | "none";

interface ApplicationData {
  _id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  documents?: {
    dtiPermit?: string;
    municipalEngineeringCert?: string;
    municipalHealthCert?: string;
    menroCert?: string;
    bfpPermit?: string;
    businessPermit?: string;
    nationalId?: string;
  };
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
}

const MyApplication = () => {
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const { data: application, isLoading } = useQueryWithLoading(
    "myResortOwnerApplication",
    apiClient.fetchMyResortOwnerApplication,
    {
      loadingMessage: "Loading your application...",
    }
  );

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return (
          <UIBadge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </UIBadge>
        );
      case "approved":
        return (
          <UIBadge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </UIBadge>
        );
      case "declined":
        return (
          <UIBadge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </UIBadge>
        );
      default:
        return (
          <UIBadge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            No Application
          </UIBadge>
        );
    }
  };

  const getStatusMessage = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "Your application is currently under review by our admin team. This typically takes 2-3 business days.";
      case "approved":
        return "Congratulations! Your resort owner application has been approved. You now have resort owner privileges.";
      case "declined":
        return "Your application was not approved. You can submit a new application with updated documents.";
      default:
        return "You haven't submitted a resort owner application yet. Click the button below to apply.";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const documentFields = [
    {
      key: "dtiPermit",
      label: "DTI Permit",
      description: "Department of Trade and Industry Permit",
    },
    {
      key: "municipalEngineeringCert",
      label: "Engineering Certification",
      description: "Certification from Municipal Engineering Office",
    },
    {
      key: "municipalHealthCert",
      label: "Health Certification",
      description: "Certification from Municipal Health Office",
    },
    {
      key: "menroCert",
      label: "MENRO Certification",
      description: "Certification from Municipal Environment and Natural Resources Office",
    },
    {
      key: "bfpPermit",
      label: "BFP Permit",
      description: "Bureau of Fire Protection fire safety permit",
    },
    {
      key: "businessPermit",
      label: "Business Permit",
      description: "Local government business permit",
    },
    {
      key: "nationalId",
      label: "National ID",
      description: "Resort Owner's National ID",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading your application...</span>
          </div>
        </div>
      </div>
    );
  }

  const appData = application?.application as ApplicationData | undefined;
  const status = appData?.status || "none";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              My Resort Owner Application
            </CardTitle>
            <CardDescription className="text-gray-600">
              View the status of your resort owner application and submitted documents
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
                {getStatusBadge(status)}
              </div>
              <p className="text-sm text-gray-600 mb-4">{getStatusMessage(status)}</p>
              
              {appData && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Submitted: {formatDate(appData.createdAt)}
                  </div>
                  {appData.updatedAt && appData.updatedAt !== appData.createdAt && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Last Updated: {formatDate(appData.updatedAt)}
                    </div>
                  )}
                  {appData.approvedAt && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approved: {formatDate(appData.approvedAt)}
                    </div>
                  )}
                </div>
              )}

              {status === "declined" && appData?.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Reason for decline:</strong> {appData.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            {appData?.documents && Object.keys(appData.documents).length > 0 && (
              <>
                <Separator className="bg-gray-200" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentFields.map((field) => {
                      const documentUrl = appData.documents?.[field.key as keyof typeof appData.documents];
                      if (!documentUrl) return null;

                      return (
                        <div key={field.key} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{field.label}</h4>
                              <p className="text-xs text-gray-500">{field.description}</p>
                            </div>
                            <File className="w-5 h-5 text-gray-400" />
                          </div>
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline mt-2"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Document
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Separator className="bg-gray-200" />
            <div className="flex flex-col sm:flex-row gap-3">
              {status === "none" && (
                <Button
                  onClick={() => navigate("/apply-resort-owner")}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Apply for Resort Owner
                </Button>
              )}
              
              {status === "declined" && (
                <Button
                  onClick={() => navigate("/apply-resort-owner")}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit New Application
                </Button>
              )}

              {status === "approved" && (
                <Button
                  onClick={() => navigate("/my-hotels")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Manage My Resorts
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                If you have any questions about your application, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyApplication;
