import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import Image from "next/image";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "./modal";

interface ProfileImageUploadProps {
  currentImage?: string | null;
  displayName?: string;
  onImageUpdate: (imageUrl: string) => void;
  onClose?: () => void;
  variant?: "profile" | "job";
  size?: number;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  displayName = "",
  onImageUpdate,
  onClose,
  variant = "profile",
  size = 120,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validTypes = useMemo(
    () => ["image/jpeg", "image/jpg", "image/png"],
    [],
  );
  const MAX_FILE_SIZE_MB = 10; // 10MB

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload a JPEG or PNG file.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [validTypes],
  );

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!selectedFile) return;

      setIsLoading(true);
      try {
        const imageUrl = await uploadFileToBucket(selectedFile);
        if (imageUrl) {
          onImageUpdate(imageUrl as string);
          toast.success(
            `${variant === "profile" ? "Profile" : "Job"} image updated successfully!`,
          );
          handleClose();
        }
      } catch (error) {
        toast.error("Failed to upload image");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFile, variant, onImageUpdate, handleClose],
  );

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onClose) onClose();
    },
    [onClose],
  );

  const modalTitle =
    variant === "profile" ? "Edit Profile Image" : "Edit Job Image";
  const modalSubtitle =
    variant === "profile"
      ? "Update your profile picture"
      : "Update your job listing image";

  const hexagonSize = size * 1.1; // Slightly larger to accommodate the hexagon shape
  const boxShadow =
    "0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08)";

  return (
    <>
      <div onClick={openModal} className="cursor-pointer relative">
        {currentImage ? (
          <div
            className="relative"
            style={{
              width: `${hexagonSize}px`,
              height: `${hexagonSize}px`,
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center shadow-2xl"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                backgroundColor: "#F0F0F0",
                overflow: "hidden",
              }}
            >
              <Image
                src={currentImage}
                alt={variant === "profile" ? "Profile" : "Job Image"}
                fill
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-[#FFC905] rounded-full p-2 z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </div>
        ) : (
          <div
            className="relative"
            style={{
              width: `${hexagonSize}px`,
              height: `${hexagonSize}px`,
            }}
          >
            <div
              className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                boxShadow: boxShadow,
              }}
            >
              <div className="flex flex-col items-center justify-center text-center p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 mb-1"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span className="text-xs text-gray-500 font-medium">
                  Upload a Image
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  PNG, JPG Up To 10MB
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-[#FFC905] rounded-full p-2 z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* File input outside of modal to prevent reload issues */}
      <input
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileChange}
        ref={fileInputRef}
        aria-label="Profile picture file input"
        title="Upload a profile picture"
      />

      {isOpen && (
        <Modal open={isOpen} onClose={handleClose}>
          <div
            className="p-6 w-full min-w-[320px] max-w-md"
            style={{ width: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{modalTitle}</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
                title="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-2">{modalSubtitle}</p>
            <p className="text-gray-600 mb-6 text-xs text-yellow-400">
              Please Save Your {variant === "profile" ? "Profile" : "Job"} After
              Uploading The Image and Saving Changes
            </p>

            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {previewUrl || currentImage ? (
                  <div
                    className="relative"
                    style={{
                      width: "180px",
                      height: "180px",
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        backgroundColor: "#F0F0F0",
                        overflow: "hidden",
                        boxShadow: boxShadow,
                      }}
                    >
                      <Image
                        src={previewUrl || currentImage || ""}
                        alt={variant === "profile" ? "Profile" : "Job Image"}
                        fill
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>
                    <button
                      onClick={handleButtonClick}
                      className="absolute bottom-0 right-0 bg-[#3B5BDB] text-white rounded-full p-2 z-10"
                      aria-label="Change profile picture"
                      title="Change profile picture"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className="relative"
                    style={{
                      width: "180px",
                      height: "180px",
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        boxShadow: boxShadow,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center text-center p-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-500 mb-2"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">
                          Upload a Image
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          PNG, JPG Up To 10MB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleButtonClick}
                      className="absolute bottom-0 right-0 bg-[#3B5BDB] text-white rounded-full p-2 z-10"
                      aria-label="Upload profile picture"
                      title="Upload profile picture"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 border-2 border-[#FFC905] rounded-full transition-colors"
                aria-label="Cancel changes"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !selectedFile}
                className={`px-6 py-2 bg-[#FFC905] rounded-full transition-colors ${
                  isLoading || !selectedFile
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#FF8C05]"
                }`}
                aria-label="Save profile changes"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default memo(ProfileImageUpload);
