"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import ScreenshotGenerator from "@/components/ScreenshotGenerator";
import FontSelector from "@/components/FontSelector";
import useFontLoader, { loadFont } from "@/lib/useFontLoader";
import {
  devicesIphone,
  deviceDisplaySizes,
  defaultConfigs,
  devicesIpad,
  devicesAndroidPhone,
  devicesAndroidTablet,
  deviceDimensions,
} from "@/lib/constants";
import { defaultImage } from "@/lib/deafultImage";
import { logEvent } from "@/lib/firebase";

const sliderStyles = `
  .custom-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 5px;  
    background: #e2e8f0;
    outline: none;
    margin: 10px 0;
    position: relative;
  }

  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%; 
    background: #6366f1;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: background 0.15s ease;
    margin-top: -6px; /* Adjust vertical position to center the thumb */
  }

  .custom-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #6366f1;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: background 0.15s ease;
    transform: translateY(0); /* Center the thumb in Firefox */
  }

  .custom-slider::-ms-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #6366f1;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: background 0.15s ease;
    margin-top: 0; /* Center the thumb in IE/Edge */
  }

  .custom-slider::-webkit-slider-thumb:hover,
  .custom-slider::-moz-range-thumb:hover,
  .custom-slider::-ms-thumb:hover {
    background: #4f46e5;
  }

  .custom-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    border-radius: 5px;
  }

  .custom-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    border-radius: 5px;
  }

  .custom-slider::-ms-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: transparent;
    border-color: transparent;
    color: transparent;
  }
`;
export default function AppScreenshotGenerator() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AppScreenshotGeneratorContent />
    </Suspense>
  );
}

type DeviceType = keyof typeof defaultConfigs;

function AppScreenshotGeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get deviceType from URL param, default to iphone16promax if not provided
  const urlDeviceType = (searchParams.get("deviceType") ||
    "iphone16promax") as DeviceType;
  const [deviceType, setDeviceType] = useState<DeviceType>(urlDeviceType);
  const [marketingMessage, setMarketingMessage] = useState("Best app ever!");
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    defaultImage
  );

  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    logEvent("page_view", {
      page_title: "App Screenshot Generator Homepage",
    });
  }, []);

  // Add beforeunload event listener to prompt user before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Standard way to show confirmation dialog
      e.preventDefault();
      // Custom message (note: most modern browsers show their own generic message instead)
      const message =
        "Are you sure you want to leave? All your configs will be gone.";
      e.returnValue = message; // For Chrome
      return message; // For other browsers
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Configuration options - initialize from URL params with fallback to defaults
  const defaultConfig = defaultConfigs[urlDeviceType];

  const [textColor, setTextColor] = useState(
    searchParams.get("textColor") || defaultConfig.textColor
  );
  const [backgroundColor, setBackgroundColor] = useState(
    searchParams.get("backgroundColor") || defaultConfig.backgroundColor
  );
  const [bezelWidth, setBezelWidth] = useState(
    parseFloat(
      searchParams.get("bezelWidth") || String(defaultConfig.bezelWidth)
    )
  );
  const [bezelColor, setBezelColor] = useState(
    searchParams.get("bezelColor") || defaultConfig.bezelColor
  );
  const [fontFamily, setFontFamily] = useState(
    searchParams.get("fontFamily") || defaultConfig.fontFamily
  );
  const [fontSize, setFontSize] = useState(
    parseFloat(searchParams.get("fontSize") || String(defaultConfig.fontSize))
  );
  const [fontWeight, setFontWeight] = useState<string>(
    searchParams.get("fontWeight")
      ? searchParams.get("fontWeight")!
      : String(defaultConfig.fontWeight)
  );
  const [textTopDistance, setTextTopDistance] = useState(
    parseInt(
      searchParams.get("textTopDistance") ||
        String(defaultConfig.textTopDistance)
    )
  );
  const [bezelTopDistance, setBezelTopDistance] = useState(
    parseInt(
      searchParams.get("bezelTopDistance") ||
        String(defaultConfig.bezelTopDistance)
    )
  );
  const [deviceSizeFactor, setDeviceSizeFactor] = useState(
    parseFloat(
      searchParams.get("deviceSizeFactor") ||
        String(defaultConfig.deviceSizeFactor)
    )
  );
  const [borderRadius, setBorderRadius] = useState<number>(
    parseInt(
      searchParams.get("borderRadius") || String(defaultConfig.borderRadius)
    )
  );

  useEffect(() => {
    const urlDeviceType = (searchParams.get("deviceType") ||
      deviceType) as DeviceType;
    if (urlDeviceType !== deviceType) {
      setDeviceType(urlDeviceType);
    }

    if (searchParams.get("textColor")) {
      setTextColor(searchParams.get("textColor") || textColor);
    }

    if (searchParams.get("backgroundColor")) {
      setBackgroundColor(
        searchParams.get("backgroundColor") || backgroundColor
      );
    }

    if (searchParams.get("bezelWidth")) {
      setBezelWidth(
        parseFloat(searchParams.get("bezelWidth") || String(bezelWidth))
      );
    }

    if (searchParams.get("bezelColor")) {
      setBezelColor(searchParams.get("bezelColor") || bezelColor);
    }

    if (searchParams.get("fontFamily")) {
      setFontFamily(searchParams.get("fontFamily") || fontFamily);
    }

    if (searchParams.get("fontSize")) {
      setFontSize(parseFloat(searchParams.get("fontSize") || String(fontSize)));
    }

    if (searchParams.get("fontWeight")) {
      setFontWeight(searchParams.get("fontWeight") || fontWeight);
    }

    if (searchParams.get("textTopDistance")) {
      setTextTopDistance(
        parseInt(searchParams.get("textTopDistance") || String(textTopDistance))
      );
    }

    if (searchParams.get("bezelTopDistance")) {
      setBezelTopDistance(
        parseInt(
          searchParams.get("bezelTopDistance") || String(bezelTopDistance)
        )
      );
    }

    if (searchParams.get("deviceSizeFactor")) {
      setDeviceSizeFactor(
        parseFloat(
          searchParams.get("deviceSizeFactor") || String(deviceSizeFactor)
        )
      );
    }

    if (searchParams.get("borderRadius")) {
      setBorderRadius(
        parseInt(searchParams.get("borderRadius") || String(borderRadius))
      );
    }
  }, [searchParams]);

  useFontLoader(["Inter", "DM Sans", "Outfit", "JetBrains Mono"]);

  useEffect(() => {
    if (fontFamily) {
      const mainFont = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      loadFont(mainFont, () => setFontLoaded(true));
    }
  }, [fontFamily]);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const navigateToBulkUpload = () => {
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

    router.push(`/bulk-upload?${queryParams.toString()}`);
  };

  const navigateToStoreScreenshots = () => {
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

    router.push(`/store-screenshots?${queryParams.toString()}`);
  };

  const updateUrlWithConfig = () => {
    if (typeof window === "undefined") return;

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

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  useEffect(() => {
    updateUrlWithConfig();
  }, [
    deviceType,
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
  ]);

  return (
    <>
      {/* Add custom slider styles */}
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      {/* Device Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-medium mb-4">Choose Device</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <label
              htmlFor="deviceType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Device Model
            </label>
            <div className="relative">
              <select
                id="deviceType"
                value={deviceType}
                onChange={(e) => {
                  const newDevice = e.target.value as DeviceType;
                  setDeviceType(newDevice);
                  setBezelWidth(defaultConfigs[newDevice].bezelWidth);
                  setFontSize(defaultConfigs[newDevice].fontSize);
                  setTextTopDistance(defaultConfigs[newDevice].textTopDistance);
                  setBezelTopDistance(
                    defaultConfigs[newDevice].bezelTopDistance
                  );
                  setDeviceSizeFactor(
                    defaultConfigs[newDevice].deviceSizeFactor
                  );
                  setBorderRadius(defaultConfigs[newDevice].borderRadius);
                  if (newDevice !== "iphone16promax") {
                    setUploadedImage(null);
                  } else {
                    setUploadedImage(defaultImage);
                  }
                }}
                className="w-full p-2 pr-12 border border-gray-300 rounded-md shadow-sm appearance-none focus:border-indigo-500 focus:ring-indigo-500 text-base font-primary"
              >
                <optgroup label="iPhones">
                  {Object.entries(devicesIphone).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                      {deviceDisplaySizes[
                        key as keyof typeof deviceDisplaySizes
                      ]
                        ? ` (${
                            deviceDisplaySizes[
                              key as keyof typeof deviceDisplaySizes
                            ]
                          })`
                        : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="iPads">
                  {Object.entries(devicesIpad).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                      {deviceDisplaySizes[
                        key as keyof typeof deviceDisplaySizes
                      ]
                        ? ` (${
                            deviceDisplaySizes[
                              key as keyof typeof deviceDisplaySizes
                            ]
                          })`
                        : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Android Phones">
                  {Object.entries(devicesAndroidPhone).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                      {deviceDisplaySizes[
                        key as keyof typeof deviceDisplaySizes
                      ]
                        ? ` (${
                            deviceDisplaySizes[
                              key as keyof typeof deviceDisplaySizes
                            ]
                          })`
                        : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Android Tablets">
                  {Object.entries(devicesAndroidTablet).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                      {deviceDisplaySizes[
                        key as keyof typeof deviceDisplaySizes
                      ]
                        ? ` (${
                            deviceDisplaySizes[
                              key as keyof typeof deviceDisplaySizes
                            ]
                          })`
                        : ""}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#aaa"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Configuration Column */}
        <div className="lg:w-2/3 flex flex-col space-y-6">
          {/* Marketing Message */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label
              htmlFor="marketingMessage"
              className="block labelAsHeading text-lg font-medium mb-4"
            >
              Marketing Message
            </label>
            <textarea
              id="marketingMessage"
              placeholder="Enter your app's marketing message"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-secondary"
              value={marketingMessage}
              onChange={(e) => setMarketingMessage(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium mb-4">Upload Image</h2>
            <ImageUpload
              key={deviceType}
              deviceType={deviceType}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Text Styling Options */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium mb-4">Text Styling</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="fontFamily" className="block text-sm mb-1">
                  Font Family
                </label>
                <FontSelector value={fontFamily} onChange={setFontFamily} />
              </div>

              <div>
                <label htmlFor="fontSize" className="block text-sm mb-1">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  id="fontSize"
                  min="50"
                  max="150"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full custom-slider"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="fontWeight" className="block text-sm mb-1">
                  Font Weight
                </label>
                <div className="relative">
                  <select
                    id="fontWeight"
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value)}
                    className="w-full p-2 pr-12 border border-gray-300 rounded-md shadow-sm appearance-none focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">Thin (100)</option>
                    <option value="200">Extra Light (200)</option>
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="#aaa"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="textTopDistance" className="block text-sm mb-1">
                  Distance from top: {textTopDistance}px
                </label>
                <input
                  type="range"
                  id="textTopDistance"
                  min="100"
                  max={deviceDimensions[deviceType].height}
                  value={textTopDistance}
                  onChange={(e) => setTextTopDistance(parseInt(e.target.value))}
                  className="w-full custom-slider"
                />
              </div>
            </div>

            <div>
              <label htmlFor="textColor" className="block text-sm mb-1">
                Text Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="textColor"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-8 w-8 border-0 p-0 mr-2"
                />
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    #
                  </div>
                  <input
                    type="text"
                    value={textColor.replace("#", "")}
                    onChange={(e) => {
                      // Only allow hex characters
                      const hex = e.target.value
                        .replace(/[^0-9A-Fa-f]/g, "")
                        .slice(0, 6);
                      setTextColor(`#${hex}`);
                    }}
                    className="w-full p-2 pl-7 border border-gray-300 rounded-md text-xs"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Device Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium mb-4">
              Device Positioning & Appearance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="bezelTopDistance"
                  className="block text-sm mb-1"
                >
                  Distance from top: {bezelTopDistance}px
                </label>
                <input
                  type="range"
                  id="bezelTopDistance"
                  min={-deviceDimensions[deviceType].height / 2}
                  max={deviceDimensions[deviceType].height / 2}
                  value={bezelTopDistance}
                  onChange={(e) =>
                    setBezelTopDistance(parseInt(e.target.value))
                  }
                  className="w-full custom-slider"
                />
              </div>

              <div>
                <label
                  htmlFor="deviceSizeFactor"
                  className="block text-sm mb-1"
                >
                  Device Size Factor: {deviceSizeFactor.toFixed(1)}x
                </label>
                <input
                  type="range"
                  id="deviceSizeFactor"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={deviceSizeFactor}
                  onChange={(e) =>
                    setDeviceSizeFactor(parseFloat(e.target.value))
                  }
                  className="w-full custom-slider"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="backgroundColor" className="block text-sm mb-1">
                  Background Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-8 w-8 border-0 p-0 mr-2"
                  />
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      #
                    </div>
                    <input
                      type="text"
                      value={backgroundColor.replace("#", "")}
                      onChange={(e) => {
                        // Only allow hex characters
                        const hex = e.target.value
                          .replace(/[^0-9A-Fa-f]/g, "")
                          .slice(0, 6);
                        setBackgroundColor(`#${hex}`);
                      }}
                      className="w-full p-2 pl-7 border border-gray-300 rounded-md text-xs"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="bezelWidth" className="block text-sm mb-1">
                  Bezel Width: {bezelWidth}px
                </label>
                <input
                  type="range"
                  id="bezelWidth"
                  min="0"
                  max="50"
                  value={bezelWidth}
                  onChange={(e) => setBezelWidth(parseInt(e.target.value))}
                  className="w-full custom-slider"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bezelColor" className="block text-sm mb-1">
                Bezel Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="bezelColor"
                  value={bezelColor}
                  onChange={(e) => setBezelColor(e.target.value)}
                  className="h-8 w-8 border-0 p-0 mr-2"
                />
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    #
                  </div>
                  <input
                    type="text"
                    value={bezelColor.replace("#", "")}
                    onChange={(e) => {
                      // Only allow hex characters
                      const hex = e.target.value
                        .replace(/[^0-9A-Fa-f]/g, "")
                        .slice(0, 6);
                      setBezelColor(`#${hex}`);
                    }}
                    className="w-full p-2 pl-7 border border-gray-300 rounded-md text-xs"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="borderRadius" className="block text-sm mb-1">
                Border Radius: {borderRadius}px
              </label>
              <input
                type="range"
                id="borderRadius"
                min="0"
                max="60"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                className="w-full custom-slider"
              />
            </div>
          </div>
        </div>

        {/* Preview Column - Fixed on large screens */}
        <div className="lg:w-1/3 lg:sticky lg:top-4 self-start">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium mb-4">Preview</h2>

            {uploadedImage ? (
              <ScreenshotGenerator
                key={deviceType}
                fontLoaded={fontLoaded}
                screenshotImage={uploadedImage}
                marketingMessage={marketingMessage}
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
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-center">
                  {!uploadedImage && !marketingMessage
                    ? "Upload an image and add a marketing message to see the preview"
                    : !uploadedImage
                    ? "Upload an image to see the preview"
                    : "Add a marketing message to see the preview"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={navigateToBulkUpload}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
              <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
            </svg>
            Generate Multiple With Current Config
          </button>

          <button
            onClick={navigateToStoreScreenshots}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Generate Store Screenshots (All Languages)
          </button>
        </div>

        <div className="text-sm text-gray-600 max-w-2xl mx-auto">
          <p className="mb-2">
            <strong>Generate Multiple:</strong> Upload multiple images and
            create screenshots with custom messages for each.
          </p>
          <p>
            <strong>Store Screenshots:</strong> Upload 8 images and
            automatically generate screenshots for all 40 languages using
            pre-defined marketing messages.
          </p>
        </div>
      </div>
    </>
  );
}
