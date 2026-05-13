import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutationWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import {
  FileText,
  Upload,
  CheckCircle,
  ArrowLeft,
  X,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Label } from "../../../shared/ui/label";
import { Separator } from "../../../shared/ui/separator";

export type ResortOwnerApplicationFormData = {
  dtiPermit: File;
  municipalEngineeringCert: File;
  municipalHealthCert: File;
  menroCert: File;
  bfpPermit: File;
  businessPermit: File;
  nationalId: File;
};

const ApplyResortOwner = () => {
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const mutation = useMutationWithLoading(
    (formData: FormData) => apiClient.submitResortOwnerApplication(formData),
    {
      onSuccess: () => {
        showToast({
          title: "Application Submitted",
          description: "Your resort owner application has been submitted successfully. An admin will review your documents.",
          type: "SUCCESS",
        });
        navigate("/");
      },
      onError: (error: Error) => {
        showToast({
          title: "Application Failed",
          description: error.message,
          type: "ERROR",
        });
      },
      loadingMessage: "Submitting your application...",
    }
  );

  const handleFileChange = (fieldName: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [fieldName]: file }));

    // Create preview for image files
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrls((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
    setPreviewUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[fieldName];
      return newUrls;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const onSubmit = () => {
    const requiredFields: (keyof ResortOwnerApplicationFormData)[] = [
      "dtiPermit",
      "municipalEngineeringCert",
      "municipalHealthCert",
      "menroCert",
      "bfpPermit",
      "businessPermit",
      "nationalId",
    ];

    const missingFields = requiredFields.filter(
      (field) => !uploadedFiles[field]
    );

    if (missingFields.length > 0) {
      showToast({
        title: "Missing Documents",
        description: "Please upload all required documents before submitting.",
        type: "ERROR",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      formData.append(key, file);
    });

    mutation.mutate(formData);
  };

  const documentFields = [
    {
      name: "dtiPermit" as const,
      label: "DTI Permit",
      description: "Department of Trade and Industry Permit",
    },
    {
      name: "municipalEngineeringCert" as const,
      label: "Certification from Municipal Engineering Office",
      description: "Engineering certification for your resort",
    },
    {
      name: "municipalHealthCert" as const,
      label: "Certification from Municipal Health Office",
      description: "Health and sanitation certification",
    },
    {
      name: "menroCert" as const,
      label: "Certification from MENRO",
      description: "Municipal Environment and Natural Resources Office certification",
    },
    {
      name: "bfpPermit" as const,
      label: "Permit from BFP",
      description: "Bureau of Fire Protection fire safety permit",
    },
    {
      name: "businessPermit" as const,
      label: "Business Permit",
      description: "Local government business permit",
    },
    {
      name: "nationalId" as const,
      label: "Resort Owner's National ID",
      description: "Valid government-issued ID",
    },
  ];

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
              Apply for Resort Owner
            </CardTitle>
            <CardDescription className="text-gray-600">
              Upload the required documents to apply for resort owner privileges
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All documents are required. Your application
                will be reviewed by an admin before approval. Please ensure all
                documents are clear and valid.
              </p>
            </div>

            <div className="space-y-4">
              {documentFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label
                    htmlFor={field.name}
                    className="text-sm font-semibold text-gray-700"
                  >
                    {field.label} <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">{field.description}</p>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type="file"
                      className="pl-10 pr-3 py-3 border border-gray-300 rounded-md text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileChange(field.name, file);
                    }
                  }}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {uploadedFiles[field.name] && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {previewUrls[field.name] ? (
                            <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-300 flex-shrink-0">
                              <img
                                src={previewUrls[field.name]}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-md bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0">
                              <File className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {uploadedFiles[field.name].name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFiles[field.name].size)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {isImageFile(uploadedFiles[field.name]) ? "Image file" : "Document"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(field.name)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Separator className="bg-gray-200" />

            <Button
              onClick={onSubmit}
              disabled={mutation.isLoading}
              className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {mutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Application...
                </div>
              ) : (
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Submit Application
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By submitting this application, you confirm that all documents are
              authentic and valid. False information may result in account
              suspension.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplyResortOwner;
