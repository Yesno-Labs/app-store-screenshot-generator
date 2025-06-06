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

type DeviceType = keyof typeof defaultConfigs;

interface LanguageMessages {
  language: string;
  messages: string[];
}

interface UploadedImage {
  id: string;
  imageUrl: string;
  file: File;
}

export default function StoreScreenshots() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <StoreScreenshotsContent />
    </Suspense>
  );
}

function StoreScreenshotsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const deviceType = (searchParams.get("deviceType") ||
    "iphone16promax") as DeviceType;

  const config = defaultConfigs[deviceType];
  const [languageMessages, setLanguageMessages] = useState<LanguageMessages[]>(
    []
  );
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

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

  // Parse CSV and load language messages
  useEffect(() => {
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    };

    const loadLanguageMessages = async () => {
      try {
        const response = await fetch("/screenshots_localizations.csv");
        const csvText = await response.text();
        const lines = csvText.trim().split("\n");

        const languages: LanguageMessages[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const language = values[0];
          const messages = values.slice(1, 9); // Get Screenshot_1 to Screenshot_8

          languages.push({
            language,
            messages,
          });
        }

        setLanguageMessages(languages);
      } catch (error) {
        console.error("Error loading language messages:", error);
        toast.error("Failed to load language messages");
      }
    };

    loadLanguageMessages();
  }, []);

  // Handle multiple file uploads for the 8 images
  const handleImageUploads = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsValidating(true);
    setUploadErrors([]);

    const files = Array.from(e.target.files).sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    if (files.length !== 8) {
      setUploadErrors(["Please select exactly 8 images"]);
      setIsValidating(false);
      return;
    }

    const validationResults = [];
    const validImages: UploadedImage[] = [];

    // Process each file
    for (const file of files) {
      // Check if file is a PNG or jpeg
      if (file.type !== "image/png" && file.type !== "image/jpeg") {
        validationResults.push(`"${file.name}" is not a PNG or JPEG image`);
        continue;
      }

      // Validate dimensions
      try {
        const result = await validateImageDimensions(file);
        if (result.isValid && result.imageUrl) {
          validImages.push({
            id: crypto.randomUUID(),
            imageUrl: result.imageUrl,
            file,
          });
        } else {
          validationResults.push(
            result.error || `"${file.name}" validation failed`
          );
        }
      } catch (error) {
        validationResults.push(`"${file.name}" could not be processed`);
      }
    }

    if (validationResults.length > 0) {
      setUploadErrors(validationResults);
    } else {
      setUploadedImages(validImages);
      toast.success("All 8 images uploaded successfully!");
    }

    setIsValidating(false);
    e.target.value = "";
  };

  // Validate image dimensions
  const validateImageDimensions = (
    file: File
  ): Promise<{
    isValid: boolean;
    imageUrl?: string;
    error?: string;
  }> => {
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
              isValid: false,
              error: `"${file.name}" has incorrect dimensions. Should be ${expectedDimensions.width} × ${expectedDimensions.height} pixels.`,
            });
          } else {
            resolve({
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

  // Helper functions copied from ScreenshotGenerator
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
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

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
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Generate and download all screenshots
  const generateAndDownloadAll = async () => {
    if (uploadedImages.length !== 8 || languageMessages.length === 0) {
      toast.error("Please upload 8 images first");
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      let totalScreenshots = 0;
      let skippedScreenshots = 0;

      console.log(
        `Starting generation for ${languageMessages.length} languages with 8 images each`
      );

      // Use canvasDimensions like ScreenshotGenerator does
      const dimensions =
        canvasDimensions[deviceType as keyof typeof canvasDimensions] ||
        canvasDimensions.iphone16promax;

      // Generate screenshots for each language
      for (
        let langIndex = 0;
        langIndex < languageMessages.length;
        langIndex++
      ) {
        const languageData = languageMessages[langIndex];
        const languageFolder = zip.folder(languageData.language);

        console.log(
          `Processing language ${langIndex + 1}/${languageMessages.length}: ${
            languageData.language
          }`
        );

        // Generate 8 screenshots for this language
        for (let i = 0; i < 8; i++) {
          const image = uploadedImages[i];
          const message = languageData.messages[i];

          if (!image) {
            console.warn(`Missing image ${i + 1} for ${languageData.language}`);
            skippedScreenshots++;
            continue;
          }

          if (!message || message.trim() === "") {
            console.warn(
              `Missing/empty message ${i + 1} for ${
                languageData.language
              }: "${message}"`
            );
            skippedScreenshots++;
            continue;
          }

          // Create a temporary canvas using the EXACT same logic as ScreenshotGenerator
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (ctx) {
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve) => {
              img.onload = () => {
                try {
                  // Clear canvas
                  ctx.clearRect(0, 0, canvas.width, canvas.height);

                  // Fill background
                  ctx.fillStyle = backgroundColor;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  // Calculate maximum available width and height
                  const maxScreenshotWidth = canvas.width * 0.85;
                  const maxScreenshotHeight = canvas.height * 0.7;

                  // Apply device size factor
                  let scale =
                    Math.min(
                      maxScreenshotWidth / (img.width + bezelWidth * 2),
                      maxScreenshotHeight / (img.height + bezelWidth * 2)
                    ) * deviceSizeFactor;

                  // Calculate scaled dimensions for the screenshot
                  const scaledWidth = img.width * scale;
                  const scaledHeight = img.height * scale;

                  // Calculate bezel dimensions
                  const totalBezelWidth = scaledWidth + bezelWidth * 2;
                  const totalBezelHeight = scaledHeight + bezelWidth * 2;

                  // Center the bezel horizontally
                  const bezelX = (canvas.width - totalBezelWidth) / 2;

                  // Set bezel Y position based on user input
                  const bezelY = bezelTopDistance;

                  // Draw bezel with rounded corners
                  ctx.fillStyle = bezelColor;
                  drawRoundedRect(
                    ctx,
                    bezelX,
                    bezelY,
                    totalBezelWidth,
                    totalBezelHeight,
                    borderRadius
                  );

                  // Calculate inner bezel area for screenshot
                  const screenX = bezelX + bezelWidth;
                  const screenY = bezelY + bezelWidth;
                  const screenWidth = scaledWidth;
                  const screenHeight = scaledHeight;
                  const screenCornerRadius = Math.max(
                    0,
                    borderRadius - bezelWidth
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
                  ctx.drawImage(
                    img,
                    screenX,
                    screenY,
                    screenWidth,
                    screenHeight
                  );

                  // Restore context state to remove clipping
                  ctx.restore();

                  // Text positioning and rendering - EXACT same logic as ScreenshotGenerator
                  ctx.fillStyle = textColor;
                  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                  ctx.textAlign = "center";

                  // Calculate text position
                  const textX = canvas.width / 2;

                  // Always use textTopDistance for text positioning (NOT relative to bezel!)
                  const textY = textTopDistance;

                  // Set horizontal text padding (percentage of canvas width)
                  const textWidthLimit = canvas.width * 0.8; // 80% of canvas width

                  // Draw text with word wrapping and line breaks
                  const lineHeight = fontSize * 1.2;
                  const paragraphs = message.split("\n");
                  let currentY = textY;

                  paragraphs.forEach((paragraph) => {
                    // Skip empty paragraphs but still add line spacing
                    if (paragraph.trim() === "") {
                      currentY += lineHeight;
                      return;
                    }

                    const words = paragraph.split(" ");
                    let currentLine = words[0];

                    for (let j = 1; j < words.length; j++) {
                      const word = words[j];
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

                  resolve();
                } catch (error) {
                  console.error(
                    `Error processing ${languageData.language} screenshot ${
                      i + 1
                    }:`,
                    error
                  );
                  resolve();
                }
              };

              img.onerror = () => {
                console.error(
                  `Failed to load image ${i + 1} for ${languageData.language}`
                );
                resolve();
              };

              img.src = image.imageUrl;
            });

            // Convert canvas to blob and add to zip
            await new Promise<void>((resolve) => {
              canvas.toBlob((blob) => {
                if (blob && languageFolder) {
                  languageFolder.file(
                    `screenshot-${i + 1}-${deviceType}.png`,
                    blob
                  );
                  totalScreenshots++;
                  console.log(
                    `Generated screenshot ${totalScreenshots}: ${
                      languageData.language
                    } ${i + 1}`
                  );
                } else {
                  console.error(
                    `Failed to create blob for ${
                      languageData.language
                    } screenshot ${i + 1}`
                  );
                  skippedScreenshots++;
                }
                resolve();
              }, "image/png");
            });
          } else {
            console.error(
              `Failed to get canvas context for ${
                languageData.language
              } screenshot ${i + 1}`
            );
            skippedScreenshots++;
          }
        }
      }

      console.log(
        `Generation complete. Total: ${totalScreenshots}, Skipped: ${skippedScreenshots}`
      );

      // Generate and save the zip file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `store-screenshots-${deviceType}-all-languages.zip`);

      toast.success(
        `Successfully generated ${totalScreenshots} screenshots! (${skippedScreenshots} skipped due to missing content)`
      );
    } catch (error) {
      console.error("Error generating screenshots:", error);
      toast.error("Error generating screenshots");
    } finally {
      setIsDownloading(false);
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
            Store Screenshots Generator
          </h1>
          <div className="w-[180px] invisible"></div>
        </div>
        <p className="text-gray-600 font-secondary mt-1">
          Device: {deviceNames[deviceType]}
        </p>
        <p className="text-gray-500 font-secondary text-sm mt-1">
          Generate 8 screenshots for {languageMessages.length} languages (
          {languageMessages.length * 8} total screenshots)
        </p>
      </header>

      <div className="max-w-6xl mx-auto mb-8">
        {/* Upload 8 Images Section */}
        <div className="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-100 mb-8">
          <h2 className="text-xl font-display font-semibold mb-4 text-gray-900">
            Upload 8 Screenshot Images
          </h2>
          <p className="text-gray-600 font-secondary mb-4">
            Select exactly 8 images that will be used to generate screenshots
            for all {languageMessages.length} languages. Images must be exactly{" "}
            {deviceDimensions[deviceType].width} ×{" "}
            {deviceDimensions[deviceType].height} pixels. Images will be sorted
            alphanumerically by file name.
          </p>

          <div className="flex flex-col">
            <input
              type="file"
              id="multi-upload"
              multiple
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleImageUploads}
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
                    Select 8 images
                  </span>
                  <span className="text-sm text-gray-500 mt-1 font-secondary">
                    PNG or JPEG format
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

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Uploaded Images ({uploadedImages.length}/8)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={image.id} className="text-center">
                  <img
                    src={image.imageUrl}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-auto rounded-md border border-gray-200 mb-2"
                  />
                  <p className="text-sm text-gray-600 font-secondary">
                    Screenshot {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Preview */}
        {uploadedImages.length > 0 && languageMessages.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Preview with Current Configuration
            </h2>
            <p className="text-sm text-gray-600 font-secondary mb-4">
              This shows how your screenshots will look with the configuration
              from the home page.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Show first image with first English message as preview */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Sample: {languageMessages[0]?.language || "Sample"} -
                  Screenshot 1
                </h3>
                <ScreenshotGenerator
                  screenshotImage={uploadedImages[0].imageUrl}
                  marketingMessage={
                    languageMessages[0]?.messages[0] || "Sample message"
                  }
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
                  screenshotId="preview-sample"
                />
              </div>

              {/* Show configuration details */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Current Configuration
                </h3>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <div>Device: {deviceType}</div>
                  <div>Text Color: {textColor}</div>
                  <div>Background: {backgroundColor}</div>
                  <div>Font: {fontFamily}</div>
                  <div>Font Size: {fontSize}px</div>
                  <div>Font Weight: {fontWeight}</div>
                  <div>Text Distance: {textTopDistance}px</div>
                  <div>Bezel Distance: {bezelTopDistance}px</div>
                  <div>Bezel Width: {bezelWidth}px</div>
                  <div>Bezel Color: {bezelColor}</div>
                  <div>Device Scale: {deviceSizeFactor}x</div>
                  <div>Border Radius: {borderRadius}px</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Languages and Messages Preview */}
        {languageMessages.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">
              Languages and Marketing Messages ({languageMessages.length}{" "}
              languages)
            </h2>
            <div className="max-h-64 overflow-y-auto">
              {languageMessages.slice(0, 5).map((lang, index) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {lang.language}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 font-secondary">
                    {lang.messages.map((message, msgIndex) => (
                      <div key={msgIndex}>
                        <span className="font-medium">
                          Screenshot {msgIndex + 1}:
                        </span>{" "}
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {languageMessages.length > 5 && (
                <p className="text-sm text-gray-500 text-center font-secondary">
                  ... and {languageMessages.length - 5} more languages
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generate and Download Button */}
        {uploadedImages.length === 8 && languageMessages.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={generateAndDownloadAll}
              disabled={isDownloading}
              className="px-8 py-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 inline-flex items-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Screenshots...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generate & Download All {languageMessages.length * 8}{" "}
                  Screenshots
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
