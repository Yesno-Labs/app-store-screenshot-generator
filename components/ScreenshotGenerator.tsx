import { useRef, useEffect } from "react";
import {
  deviceDimensions,
  canvasDimensions,
  deviceNames,
} from "@/lib/constants";

interface ScreenshotGeneratorProps {
  screenshotImage: string | null;
  marketingMessage: string;
  deviceType: string;
  textColor: string;
  backgroundColor: string;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  bezelTopDistance: number;
  textTopDistance: number;
  deviceSizeFactor: number;
  borderRadius: number;
  screenshotId?: string;
  fontLoaded?: boolean;
}

const ScreenshotGenerator = ({
  screenshotImage,
  marketingMessage,
  deviceType,
  textColor = "#FFFFFF",
  backgroundColor = "#0099FF",
  bezelWidth = 20,
  bezelColor = "#F5F5F7",
  fontFamily = "Arial, sans-serif",
  fontSize = 54,
  fontWeight = "normal",
  bezelTopDistance = 400,
  textTopDistance = 200,
  deviceSizeFactor = 1.0,
  borderRadius = 30,
  screenshotId,
  fontLoaded,
}: ScreenshotGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!screenshotImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the imported deviceDimensions
    const dimensions =
      canvasDimensions[deviceType as keyof typeof canvasDimensions] ||
      canvasDimensions.iphone16promax;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const img = new Image();
    img.onload = () => {
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
      const screenCornerRadius = Math.max(0, borderRadius - bezelWidth);

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
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";

      // Calculate text position
      const textX = canvas.width / 2;

      // Always use textTopDistance for text positioning
      const textY = textTopDistance;

      // Set horizontal text padding (percentage of canvas width)
      const textWidthLimit = canvas.width * 0.8; // 80% of canvas width

      // Draw text with word wrapping and line breaks
      const lineHeight = fontSize * 1.2;
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

      // Copy to display canvas if it exists
      if (displayCanvasRef.current) {
        const displayCtx = displayCanvasRef.current.getContext("2d");
        if (displayCtx) {
          displayCanvasRef.current.width = canvas.width;
          displayCanvasRef.current.height = canvas.height;
          displayCtx.drawImage(canvas, 0, 0);
        }
      }
    };

    img.src = screenshotImage;
  }, [
    screenshotImage,
    marketingMessage,
    deviceType,
    textColor,
    backgroundColor,
    bezelWidth,
    bezelColor,
    fontFamily,
    fontSize,
    fontWeight,
    bezelTopDistance,
    textTopDistance,
    deviceSizeFactor,
    borderRadius,
    fontLoaded,
  ]);

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
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
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
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `app-store-screenshot-${deviceType}.png`;
    link.href = dataUrl;
    link.click();
  };

  // const handleExportConfig = async () => {
  //   // Create config object with all current settings (excluding deviceType)
  //   const configExport = {
  //     textColor,
  //     backgroundColor,
  //     bezelWidth,
  //     bezelColor,
  //     fontFamily,
  //     fontSize,
  //     fontWeight,
  //     bezelTopDistance,
  //     textTopDistance,
  //     deviceSizeFactor,
  //     borderRadius,
  //   };

  //   // Convert to JSON string
  //   const configJson = JSON.stringify(configExport, null, 2);

  //   // Copy to clipboard
  //   try {
  //     await navigator.clipboard.writeText(configJson);

  //     // Change button text temporarily to provide feedback
  //     const button = document.getElementById("export-config-btn");
  //     if (button) {
  //       const originalText = button.textContent;
  //       button.textContent = "Copied!";
  //       button.classList.remove("bg-green-600", "hover:bg-green-700");
  //       button.classList.add("bg-green-500");

  //       setTimeout(() => {
  //         button.textContent = originalText;
  //         button.classList.remove("bg-green-500");
  //         button.classList.add("bg-green-600", "hover:bg-green-700");
  //       }, 2000);
  //     }
  //   } catch (err) {
  //     console.error("Failed to copy: ", err);
  //     alert("Failed to copy configuration to clipboard");
  //   }
  // };

  return (
    <div className="mt-4 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="hidden"
        data-screenshot-id={screenshotId}
      />

      {screenshotImage && (
        <>
          <div className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-md">
            <canvas ref={displayCanvasRef} className="w-full h-auto" />
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>
              {(() => {
                const dimensions =
                  deviceDimensions[deviceType as keyof typeof deviceDimensions];
                const name =
                  deviceNames[deviceType as keyof typeof deviceNames];
                return `${name}: ${dimensions.width} × ${dimensions.height} px`;
              })()}
            </p>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Download Screenshot
            </button>

            {/* <button
              id="export-config-btn"
              onClick={handleExportConfig}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Copy Config
            </button> */}
          </div>
        </>
      )}
    </div>
  );
};

export default ScreenshotGenerator;
