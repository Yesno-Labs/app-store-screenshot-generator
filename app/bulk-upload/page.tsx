"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import ScreenshotGenerator from "@/components/ScreenshotGenerator";
import {
  deviceNames,
  defaultConfigs,
  deviceDimensions,
  canvasDimensions,
} from "@/lib/constants";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { loadFont } from "@/lib/useFontLoader";
import { toast } from "react-hot-toast";
import {
  getAvailableLanguages,
  getMarketingMessagesForLanguage,
} from "@/lib/marketing-messages";

type DeviceType = keyof typeof defaultConfigs;

interface Screenshot {
  id: string;
  marketingMessage: string;
  uploadedImage: string | null;
}

type FileValidationResult = {
  file: File;
  isValid: boolean;
  imageUrl?: string;
  error?: string;
};

const defaultPrefilledBulkMarketingMessages = [
  "Marketing Message 1",
  "Marketing Message 2",
  "Marketing Message 3",
];

// Utility function to generate screenshot canvas programmatically
const generateScreenshotCanvas = (
  screenshotImage: string,
  marketingMessage: string,
  deviceType: string,
  config: {
    textColor: string;
    backgroundColor: string;
    bezelWidth: number;
    bezelColor: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    textTopDistance: number;
    bezelTopDistance: number;
    deviceSizeFactor: number;
    borderRadius: number;
  }
): Promise<HTMLCanvasElement | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    // Set canvas dimensions
    const dimensions =
      canvasDimensions[deviceType as keyof typeof canvasDimensions] ||
      canvasDimensions.iphone16promax;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const img = new Image();
    img.onload = () => {
      // Helper function to draw rounded rectangles
      const drawRoundedRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(
          x + width,
          y + height,
          x + width - radius,
          y + height,
          radius
        );
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
      };

      // Helper function to create a rounded rectangle path (for clipping)
      const createRoundedRectPath = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(
          x + width,
          y + height,
          x + width - radius,
          y + height,
          radius
        );
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
      };

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill background
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate maximum available width and height
      const maxScreenshotWidth = canvas.width * 0.85;
      const maxScreenshotHeight = canvas.height * 0.7;

      // Apply device size factor
      let scale =
        Math.min(
          maxScreenshotWidth / (img.width + config.bezelWidth * 2),
          maxScreenshotHeight / (img.height + config.bezelWidth * 2)
        ) * config.deviceSizeFactor;

      // Calculate scaled dimensions for the screenshot
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Calculate bezel dimensions
      const totalBezelWidth = scaledWidth + config.bezelWidth * 2;
      const totalBezelHeight = scaledHeight + config.bezelWidth * 2;

      // Center the bezel horizontally
      const bezelX = (canvas.width - totalBezelWidth) / 2;

      // Set bezel Y position based on user input
      const bezelY = config.bezelTopDistance;

      // Draw bezel with rounded corners
      ctx.fillStyle = config.bezelColor;
      drawRoundedRect(
        ctx,
        bezelX,
        bezelY,
        totalBezelWidth,
        totalBezelHeight,
        config.borderRadius
      );

      // Calculate inner bezel area for screenshot
      const screenX = bezelX + config.bezelWidth;
      const screenY = bezelY + config.bezelWidth;
      const screenWidth = scaledWidth;
      const screenHeight = scaledHeight;
      const screenCornerRadius = Math.max(
        0,
        config.borderRadius - config.bezelWidth
      );

      // Save context state before clipping
      ctx.save();

      // Create clipping path for the screenshot with rounded corners
      createRoundedRectPath(
        ctx,
        screenX,
        screenY,
        screenWidth,
        screenHeight,
        screenCornerRadius
      );
      ctx.clip();

      // Draw the screenshot within the clipped area
      ctx.drawImage(img, screenX, screenY, screenWidth, screenHeight);

      // Restore context state to remove clipping
      ctx.restore();

      // Text positioning and rendering
      ctx.fillStyle = config.textColor;
      ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
      ctx.textAlign = "center";

      // Calculate text position
      const textX = canvas.width / 2;

      // Always use textTopDistance for text positioning
      const textY = config.textTopDistance;

      // Set horizontal text padding (percentage of canvas width)
      const textWidthLimit = canvas.width * 0.8; // 80% of canvas width

      // Draw text with word wrapping and line breaks
      const lineHeight = config.fontSize * 1.2;
      const paragraphs = marketingMessage.split("\n");
      let currentY = textY;

      paragraphs.forEach((paragraph) => {
        // Skip empty paragraphs but still add line spacing
        if (paragraph.trim() === "") {
          currentY += lineHeight;
          return;
        }

        const words = paragraph.split(" ");
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + " " + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > textWidthLimit) {
            // Line is too long, render current line and move to next
            ctx.fillText(currentLine, textX, currentY);
            currentY += lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        // Draw the last line of this paragraph
        ctx.fillText(currentLine, textX, currentY);
        currentY += lineHeight;
      });

      resolve(canvas);
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = screenshotImage;
  });
};

export default function BulkUpload() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <BulkUploadContent />
    </Suspense>
  );
}

function BulkUploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const deviceType = (searchParams.get("deviceType") ||
    "iphone16promax") as DeviceType;

  const config = defaultConfigs[deviceType];
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [hasUploadedImages, setHasUploadedImages] = useState(false);

  const [textColor, setTextColor] = useState(
    searchParams.get("textColor") || config.textColor
  );
  const [backgroundColor, setBackgroundColor] = useState(
    searchParams.get("backgroundColor") || config.backgroundColor
  );
  const [bezelWidth, setBezelWidth] = useState(
    parseFloat(searchParams.get("bezelWidth") || String(config.bezelWidth))
  );
  const [bezelColor, setBezelColor] = useState(
    searchParams.get("bezelColor") || config.bezelColor
  );
  const [fontFamily, setFontFamily] = useState(
    searchParams.get("fontFamily") || config.fontFamily
  );
  const [fontSize, setFontSize] = useState(
    parseFloat(searchParams.get("fontSize") || String(config.fontSize))
  );
  const [fontWeight, setFontWeight] = useState<string>(
    searchParams.get("fontWeight") || String(config.fontWeight)
  );
  const [textTopDistance, setTextTopDistance] = useState(
    parseInt(
      searchParams.get("textTopDistance") || String(config.textTopDistance)
    )
  );
  const [bezelTopDistance, setBezelTopDistance] = useState(
    parseInt(
      searchParams.get("bezelTopDistance") || String(config.bezelTopDistance)
    )
  );
  const [deviceSizeFactor, setDeviceSizeFactor] = useState(
    parseFloat(
      searchParams.get("deviceSizeFactor") || String(config.deviceSizeFactor)
    )
  );
  const [borderRadius, setBorderRadius] = useState(
    parseInt(searchParams.get("borderRadius") || String(config.borderRadius))
  );

  useEffect(() => {
    if (fontFamily) {
      const fontName = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      loadFont(fontName);
    }
  }, [fontFamily]);

  const [isValidating, setIsValidating] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [bulkMarketingMessages, setBulkMarketingMessages] = useState<string[]>(
    defaultPrefilledBulkMarketingMessages
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChangedDefaultMessages =
        !selectedLanguage &&
        (bulkMarketingMessages.length !==
          defaultPrefilledBulkMarketingMessages.length ||
          bulkMarketingMessages[0] !==
            defaultPrefilledBulkMarketingMessages[0] ||
          bulkMarketingMessages[1] !==
            defaultPrefilledBulkMarketingMessages[1] ||
          bulkMarketingMessages[2] !==
            defaultPrefilledBulkMarketingMessages[2]);

      if (
        screenshots.some((s) => s.uploadedImage || s.marketingMessage) ||
        selectedLanguage ||
        hasChangedDefaultMessages
      ) {
        e.preventDefault();
        const message =
          "Are you sure you want to leave? All your screenshots will be lost.";
        e.returnValue = message; // For Chrome
        return message; // For other browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [screenshots, bulkMarketingMessages, selectedLanguage]);

  // Add a new screenshot row
  const addScreenshot = () => {
    if (screenshots.length >= 10) {
      toast.error("You can't add more than 10 screenshots.");
      return;
    }
    setScreenshots([
      ...screenshots,
      { id: crypto.randomUUID(), marketingMessage: "", uploadedImage: null },
    ]);
  };

  // Update a screenshot's marketing message
  const updateMarketingMessage = (id: string, message: string) => {
    setScreenshots(
      screenshots.map((screenshot) =>
        screenshot.id === id
          ? { ...screenshot, marketingMessage: message }
          : screenshot
      )
    );
  };

  // Update a screenshot's image
  const updateImage = (id: string, imageUrl: string) => {
    setScreenshots(
      screenshots.map((screenshot) =>
        screenshot.id === id
          ? { ...screenshot, uploadedImage: imageUrl }
          : screenshot
      )
    );
  };

  // Remove a screenshot
  const removeScreenshot = (id: string) => {
    if (screenshots.length > 1) {
      setScreenshots(screenshots.filter((screenshot) => screenshot.id !== id));
    }
  };

  // Add a new marketing message input
  const addMarketingMessageInput = () => {
    const maxMessages = selectedLanguage ? 8 : 10;
    if (bulkMarketingMessages.length >= maxMessages) {
      toast.error(
        `You can't add more than ${maxMessages} marketing messages${
          selectedLanguage ? " when using a predefined language" : ""
        }.`
      );
      return;
    }
    setBulkMarketingMessages([...bulkMarketingMessages, ""]);
  };

  // Update a marketing message
  const updateBulkMarketingMessage = (index: number, message: string) => {
    const newMessages = [...bulkMarketingMessages];
    newMessages[index] = message;
    setBulkMarketingMessages(newMessages);
  };

  // Remove a marketing message input
  const removeBulkMarketingMessage = (index: number) => {
    const minMessages = selectedLanguage ? 8 : 1;
    if (bulkMarketingMessages.length > minMessages) {
      const newMessages = bulkMarketingMessages.filter((_, i) => i !== index);
      setBulkMarketingMessages(newMessages);
    } else if (selectedLanguage) {
      toast.error(
        "Cannot remove messages when using a predefined language. Switch to 'Custom Messages' to edit."
      );
    }
  };

  // Handle language selection
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (language) {
      const messages = getMarketingMessagesForLanguage(language);
      setBulkMarketingMessages(messages);
    } else {
      setBulkMarketingMessages(defaultPrefilledBulkMarketingMessages);
    }
  };

  // Handle multiple file uploads
  const handleMultipleUploads = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsValidating(true);
    setUploadErrors([]);

    // Get files and sort them by filename
    const files = Array.from(e.target.files).sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    // Check if adding these files would exceed the 10 screenshot limit
    const currentValidScreenshots = screenshots.filter(
      (s) => s.uploadedImage !== null
    ).length;
    const emptyScreenshotsCount = screenshots.filter(
      (s) => s.uploadedImage === null
    ).length;
    const potentialNewScreenshots = Math.max(
      files.length - emptyScreenshotsCount,
      0
    );

    if (currentValidScreenshots + potentialNewScreenshots > 10) {
      setIsValidating(false);
      toast.error("You can't have more than 10 screenshots in total.");
      return;
    }

    const validationResults: FileValidationResult[] = [];

    // Process each file
    for (const file of files) {
      // Check if file is a PNG or jpeg
      if (file.type !== "image/png" && file.type !== "image/jpeg") {
        validationResults.push({
          file,
          isValid: false,
          error: `"${file.name}" is not a PNG or JPEG image`,
        });
        continue;
      }

      // Validate dimensions
      try {
        const result = await validateImageDimensions(file);
        validationResults.push(result);
      } catch (error) {
        validationResults.push({
          file,
          isValid: false,
          error: `Failed to validate "${file.name}"`,
        });
      }
    }

    // Create new screenshots for valid files
    const validFiles = validationResults.filter(
      (result) => result.isValid && result.imageUrl
    );

    if (validFiles.length > 0) {
      const newScreenshots = validFiles.map((result, index) => ({
        id: crypto.randomUUID(),
        marketingMessage:
          index < bulkMarketingMessages.length
            ? bulkMarketingMessages[index]
            : "",
        uploadedImage: result.imageUrl || null,
      }));

      // Replace existing empty screenshots or add to them
      if (screenshots.length === 1 && !screenshots[0].uploadedImage) {
        setScreenshots([...newScreenshots]);
      } else {
        // Ensure we don't exceed 10 screenshots
        const combinedScreenshots = [...screenshots, ...newScreenshots];
        if (combinedScreenshots.length > 10) {
          setScreenshots(combinedScreenshots.slice(0, 10));
          toast.error(
            `Only the first ${
              10 - screenshots.length
            } images were added to stay within the 10 screenshot limit.`
          );
        } else {
          setScreenshots(combinedScreenshots);
        }
      }

      // Set flag to indicate images have been uploaded
      setHasUploadedImages(true);
    }

    // Collect and set errors
    const errors = validationResults
      .filter((result) => !result.isValid)
      .map((result) => result.error as string);

    setUploadErrors(errors);
    setIsValidating(false);

    // Reset the file input
    e.target.value = "";
  };

  // Validate image dimensions
  const validateImageDimensions = (
    file: File
  ): Promise<FileValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const expectedDimensions = deviceDimensions[deviceType];

          if (
            img.width !== expectedDimensions.width ||
            img.height !== expectedDimensions.height
          ) {
            resolve({
              file,
              isValid: false,
              error: `"${file.name}" has incorrect dimensions. Should be ${expectedDimensions.width} × ${expectedDimensions.height} pixels.`,
            });
          } else {
            resolve({
              file,
              isValid: true,
              imageUrl: e.target?.result as string,
            });
          }
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  // Download all screenshots as a zip file
  const downloadAll = async () => {
    // Create references to all the canvases
    const canvases = document.querySelectorAll("canvas[data-screenshot-id]");
    if (!canvases.length) return;

    const zip = new JSZip();

    // Add each canvas to the zip file
    canvases.forEach((canvas, index) => {
      const id = canvas.getAttribute("data-screenshot-id");
      const screenshot = screenshots.find((s) => s.id === id);

      if (canvas instanceof HTMLCanvasElement && screenshot?.marketingMessage) {
        const imageData = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`screenshot-${index + 1}-${deviceType}.png`, imageData, {
          base64: true,
        });
      }
    });

    // Generate and save the zip file
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `app-screenshots-${deviceType}.zip`);
  };

  // Download screenshots for all languages
  const downloadAllLanguages = async () => {
    const uploadedImages = screenshots.filter((s) => s.uploadedImage);
    if (uploadedImages.length === 0) {
      toast.error(
        "Please upload at least one image before generating screenshots for all languages."
      );
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(
      "Generating screenshots for all languages..."
    );

    try {
      const zip = new JSZip();
      const languages = getAvailableLanguages();

      // For each language, generate screenshots
      for (const language of languages) {
        const languageMessages = getMarketingMessagesForLanguage(language);
        const languageFolder = zip.folder(language);

        // Generate screenshots for this language
        for (let i = 0; i < uploadedImages.length && i < 8; i++) {
          const screenshot = uploadedImages[i];
          const marketingMessage =
            languageMessages[i] || languageMessages[0] || "";

          // Create a temporary canvas to generate the screenshot
          const canvas = await generateScreenshotCanvas(
            screenshot.uploadedImage!,
            marketingMessage,
            deviceType,
            {
              textColor,
              backgroundColor,
              bezelWidth,
              bezelColor,
              fontFamily,
              fontSize,
              fontWeight,
              textTopDistance,
              bezelTopDistance,
              deviceSizeFactor,
              borderRadius,
            }
          );

          if (canvas) {
            const imageData = canvas.toDataURL("image/png").split(",")[1];
            languageFolder?.file(
              `screenshot-${i + 1}-${deviceType}.png`,
              imageData,
              {
                base64: true,
              }
            );
          }
        }
      }

      // Generate and save the zip file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `app-screenshots-all-languages-${deviceType}.zip`);

      toast.dismiss(loadingToast);
      toast.success(`Generated screenshots for ${languages.length} languages!`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate screenshots for all languages.");
      console.error("Error generating screenshots:", error);
    }
  };

  // Function to navigate back to the main page with all config params
  const navigateBackToMainPage = () => {
    const queryParams = new URLSearchParams();
    queryParams.set("deviceType", deviceType);
    queryParams.set("textColor", textColor);
    queryParams.set("backgroundColor", backgroundColor);
    queryParams.set("bezelWidth", String(bezelWidth));
    queryParams.set("bezelColor", bezelColor);
    queryParams.set("fontFamily", fontFamily);
    queryParams.set("fontSize", String(fontSize));
    queryParams.set("fontWeight", fontWeight);
    queryParams.set("textTopDistance", String(textTopDistance));
    queryParams.set("bezelTopDistance", String(bezelTopDistance));
    queryParams.set("deviceSizeFactor", String(deviceSizeFactor));
    queryParams.set("borderRadius", String(borderRadius));

    // Navigate to the main page with configuration
    router.push(`/?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-primary bg-gray-50">
      <header className="max-w-6xl mx-auto text-center mb-8">
        <div className="flex justify-between items-center">
          <button
            onClick={navigateBackToMainPage}
            className="w-[180px] px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors"
          >
            ← Change Config
          </button>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-gray-900 mb-0">
            Bulk Screenshot Generator
          </h1>
          <div className="w-[180px] invisible px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors"></div>
          {/* Placeholder div for alignment */}
        </div>
        <p className="text-gray-600 font-secondary mt-1">
          Device: {deviceNames[deviceType]}
        </p>
      </header>

      <div className="max-w-6xl mx-auto mb-8">
        {/* New multiple image upload section */}
        {!hasUploadedImages && (
          <div className="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-100 mb-8">
            {/* Language Selector */}
            <div className="mb-6">
              <h2 className="text-xl font-display font-semibold mb-4 text-gray-900">
                Select Language
              </h2>
              <p className="text-gray-600 font-secondary mb-4">
                Choose a language to automatically populate marketing messages,
                or leave blank to use custom messages.
              </p>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md font-secondary bg-white"
              >
                <option value="">Custom Messages</option>
                {getAvailableLanguages().map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-semibold mb-0 text-gray-900">
                  Pre-filled Marketing Messages
                </h2>
                {!selectedLanguage && (
                  <button
                    onClick={addMarketingMessageInput}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center font-medium transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Message
                  </button>
                )}
              </div>
              <p className="text-gray-600 font-secondary mb-4">
                {selectedLanguage
                  ? `Pre-filled with marketing messages for ${selectedLanguage}. Switch to "Custom Messages" to edit.`
                  : "Add marketing messages for each image you'll upload. Messages will be applied in the order shown below."}
              </p>

              {bulkMarketingMessages.map((message, index) => (
                <div key={index} className="flex items-start gap-2 mb-3">
                  <input
                    className={`flex-grow p-2 border border-gray-300 rounded-md font-secondary ${
                      selectedLanguage ? "bg-gray-50 text-gray-600" : ""
                    }`}
                    value={message}
                    onChange={(e) =>
                      updateBulkMarketingMessage(index, e.target.value)
                    }
                    disabled={!!selectedLanguage}
                    placeholder={
                      selectedLanguage
                        ? "Pre-filled from selected language"
                        : "Enter marketing message"
                    }
                  />
                  {((selectedLanguage && bulkMarketingMessages.length > 8) ||
                    (!selectedLanguage &&
                      bulkMarketingMessages.length > 1)) && (
                    <button
                      onClick={() => removeBulkMarketingMessage(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Remove message"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-xl font-display font-semibold mb-4 text-gray-900">
              Upload Multiple Images at Once
            </h2>
            <p className="text-gray-600 font-secondary mb-4">
              Select multiple images at once to automatically create screenshot
              sections for each one. Images must be exactly{" "}
              {deviceDimensions[deviceType].width} ×{" "}
              {deviceDimensions[deviceType].height} pixels. Your screenshots
              will be sorted alphanumerically by file name.
            </p>

            <div className="flex flex-col">
              <input
                type="file"
                id="multi-upload"
                multiple
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleMultipleUploads}
              />
              <label
                htmlFor="multi-upload"
                className={`flex justify-center items-center px-4 py-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  isValidating
                    ? "bg-gray-100 border-gray-300"
                    : "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50"
                }`}
              >
                {isValidating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-2"></div>
                    <span>Validating images...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-indigo-500 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-indigo-600 font-medium">
                      Select multiple images
                    </span>
                    <span className="text-sm text-gray-500 mt-1 font-secondary">
                      or drag and drop them here
                    </span>
                  </div>
                )}
              </label>

              {uploadErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-red-800 font-display font-medium mb-2">
                    Upload Errors:
                  </h3>
                  <ul className="list-disc list-inside text-sm text-red-700 font-secondary">
                    {uploadErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {screenshots.map((screenshot) => (
          <div
            key={screenshot.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900">
                Screenshot
              </h2>

              {screenshots.length > 1 && (
                <button
                  onClick={() => removeScreenshot(screenshot.id)}
                  className="text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Marketing Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Message
                </label>
                <textarea
                  placeholder="Enter your app's marketing message"
                  className="w-full p-2 border border-gray-300 rounded-md h-32 font-secondary"
                  value={screenshot.marketingMessage}
                  onChange={(e) =>
                    updateMarketingMessage(screenshot.id, e.target.value)
                  }
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <ImageUpload
                  key={`upload-${screenshot.id}`}
                  deviceType={deviceType}
                  onImageUpload={(imageUrl) =>
                    updateImage(screenshot.id, imageUrl)
                  }
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                {screenshot.uploadedImage ? (
                  <ScreenshotGenerator
                    key={`preview-${screenshot.id}`}
                    screenshotImage={screenshot.uploadedImage}
                    marketingMessage={screenshot.marketingMessage}
                    deviceType={deviceType}
                    textColor={textColor}
                    backgroundColor={backgroundColor}
                    bezelWidth={bezelWidth}
                    bezelColor={bezelColor}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    textTopDistance={textTopDistance}
                    bezelTopDistance={bezelTopDistance}
                    deviceSizeFactor={deviceSizeFactor}
                    borderRadius={borderRadius}
                    screenshotId={screenshot.id}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-center text-sm font-secondary">
                      {!screenshot.uploadedImage && !screenshot.marketingMessage
                        ? "Upload an image and add a marketing message"
                        : !screenshot.uploadedImage
                        ? "Upload an image"
                        : "Add a marketing message"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Download buttons */}
        {screenshots.some((s) => s.uploadedImage && s.marketingMessage) && (
          <div className="flex flex-col items-center justify-center mt-8 space-y-4">
            {hasUploadedImages && (
              <button
                onClick={addScreenshot}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors mt-4"
              >
                + Add Screenshot
              </button>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={downloadAll}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 inline-flex items-center font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download Current as ZIP
              </button>

              <button
                onClick={downloadAllLanguages}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 inline-flex items-center font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download All Languages
              </button>
            </div>
          </div>
        )}

        {/* Add Download All Languages button even when no custom messages */}
        {screenshots.some((s) => s.uploadedImage) &&
          !screenshots.some((s) => s.marketingMessage) && (
            <div className="flex flex-col items-center justify-center mt-8 space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-600 font-secondary mb-2">
                  No custom marketing messages added, but you can still generate
                  screenshots for all languages using uploaded images.
                </p>
              </div>
              <button
                onClick={downloadAllLanguages}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 inline-flex items-center font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download All Languages
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
