import { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File) => void;
  label?: string;
  className?: string;
}

const ImageUpload = ({ value, onChange, onFileChange, label = "Image", className = "" }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        
        // Call both callbacks
        onChange(result); // Set data URL for preview
        onFileChange?.(file); // Pass actual file to parent for upload
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange('');
    // Reset the file input
    const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt={label}
            className="w-full h-32 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <label
              htmlFor={`file-input-${label}`}
              className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
            >
              <span className="font-medium">Click to upload</span> or drag and drop
              <br />
              <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
            </label>
            <input
              id={`file-input-${label}`}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="text-sm text-blue-600">Uploading...</div>
      )}
    </div>
  );
};

export default ImageUpload;
