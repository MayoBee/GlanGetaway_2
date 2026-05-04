import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import axiosInstance from "../../../shared/auth/api-client";

interface UploadedDocument {
  _id: string;
  documentType: string;
  originalName: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  rejectionReason?: string;
}

interface DiscountDocumentUploadProps {
  bookingId: string;
  seniorCitizens: number;
  pwdGuests: number;
  onDocumentsChange?: (documents: UploadedDocument[]) => void;
}

const DiscountDocumentUpload: React.FC<DiscountDocumentUploadProps> = ({
  bookingId,
  seniorCitizens,
  pwdGuests,
  onDocumentsChange
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing documents on component mount
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/verification-documents/booking/${bookingId}`);
      if (response.data.success) {
        setDocuments(response.data.data);
        onDocumentsChange?.(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
    }
  }, [bookingId, onDocumentsChange]);

  useState(() => {
    fetchDocuments();
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, PDF, and DOC/DOCX files are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('bookingId', bookingId);
    formData.append('documentType', documentType);

    setUploading(documentType);
    setError(null);

    try {
      const response = await axiosInstance.post('/api/verification-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await fetchDocuments(); // Refresh documents list
      } else {
        setError(response.data.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/verification-documents/${documentId}`);
      if (response.data.success) {
        await fetchDocuments(); // Refresh documents list
      } else {
        setError(response.data.message || "Delete failed");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-orange-600" />
          Discount Verification Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Upload Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Verification Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload a PDF or DOCX file containing full names and clear pictures of IDs</li>
            <li>• Ensure all text is clearly visible and readable</li>
            <li>• File size must be less than 5MB</li>
            <li>• Accepted formats: JPEG, PNG, PDF, DOC, DOCX</li>
          </ul>
        </div>

        {/* Upload Sections */}
        <div className="space-y-4">
          {seniorCitizens > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">
                Senior Citizen ID Document {documents.some(d => d.documentType === "senior_citizen_id") && "(Uploaded)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "senior_citizen_id")}
                  disabled={uploading === "senior_citizen_id" || documents.some(d => d.documentType === "senior_citizen_id")}
                  className="flex-1"
                />
                {uploading === "senior_citizen_id" && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          )}

          {pwdGuests > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-purple-700">
                PWD ID Document {documents.some(d => d.documentType === "pwd_id") && "(Uploaded)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "pwd_id")}
                  disabled={uploading === "pwd_id" || documents.some(d => d.documentType === "pwd_id")}
                  className="flex-1"
                />
                {uploading === "pwd_id" && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Uploaded Documents</h4>
            {documents.map((doc) => (
              <div key={doc._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {doc.documentType.replace("_", " ").toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm"
                          download={doc.originalName}
                        >
                          <Download className="w-3 h-3" />
                          {doc.originalName}
                        </a>
                        <span className={getStatusBadge(doc.status)}>
                          {doc.status}
                        </span>
                      </div>
                      {doc.rejectionReason && (
                        <p className="text-red-600 text-sm mt-1">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (seniorCitizens === 0 && pwdGuests === 0) && (
          <div className="text-gray-500 text-sm text-center py-4">
            No discount verification documents required
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountDocumentUpload;
