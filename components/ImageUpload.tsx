"use client";
import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { deviceDimensions, deviceNames } from "@/lib/constants";

interface ImageUploadProps {
  deviceType: string;
  onImageUpload: (imageUrl: string) => void;
}

const ImageUpload = ({ deviceType, onImageUpload }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Reset error state
    setError(null);

    // Check if file is a PNG or JPEG
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("Please upload a PNG or JPEG image");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Get expected dimensions for the selected device
        const expectedDimensions =
          deviceDimensions[deviceType as keyof typeof deviceDimensions];

        // Check if image dimensions match the device
        if (
          img.width !== expectedDimensions.width ||
          img.height !== expectedDimensions.height
        ) {
          setError(
            `Image dimensions must be ${expectedDimensions.width} × ${
              expectedDimensions.height
            } pixels for ${deviceNames[deviceType as keyof typeof deviceNames]}`
          );
          return;
        }

        // Image is valid, pass to parent
        if (e.target?.result) {
          setFile(file);
          // console.log("File selected:", file.name);
          onImageUpload(e.target.result as string);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Get current device dimensions for display
  const currentDimensions =
    deviceDimensions[deviceType as keyof typeof deviceDimensions];
  const currentDeviceName = deviceNames[deviceType as keyof typeof deviceNames];

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-blue-900/20"
            : error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 dark:border-gray-700"
        } transition-colors cursor-pointer`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileInput}
          ref={fileInputRef}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <svg
            className={`w-12 h-12 mb-3 ${
              error ? "text-red-400" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG or JPEG files only
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-0">
            Required dimensions: {currentDimensions.width} ×{" "}
            {currentDimensions.height} pixels for {currentDeviceName}.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Take screenshots from real device or simulator.
          </p>
          {file && !error && (
            <p className="mt-2 text-sm text-green-500">Selected: {file.name}</p>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUpload;
