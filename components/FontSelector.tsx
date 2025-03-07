import { useState, useEffect } from "react";
import { loadFont } from "@/lib/useFontLoader";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}

// Define the weights we want to load for each font
const FONT_WEIGHTS_TO_LOAD = "100,200,300,400,500,600,700,800,900";

const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popularFonts, setPopularFonts] = useState<GoogleFont[]>([]);
  const [searchResults, setSearchResults] = useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);

  // List of pre-selected popular Google Fonts
  const POPULAR_GOOGLE_FONTS = [
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Roboto Condensed",
    "Source Sans Pro",
    "Oswald",
    "Poppins",
    "Roboto Mono",
    "Raleway",
    "Inter",
    "Nunito",
    "Playfair Display",
    "Rubik",
    "Work Sans",
    "PT Sans",
    "Merriweather",
    "Noto Sans",
    "Ubuntu",
  ];

  // Add this useEffect to load the current font on component mount
  useEffect(() => {
    if (value) {
      // Extract the font family name from the value (removing quotes and fallbacks)
      const fontFamily = value.split(",")[0].replace(/['"]/g, "").trim();
      loadFont(fontFamily);
    }
  }, [value]);

  // Load popular fonts when modal is opened
  useEffect(() => {
    if (isModalOpen && popularFonts.length === 0) {
      fetchPopularFonts();
    }
  }, [isModalOpen, popularFonts.length]);

  // Handle search queries
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchGoogleFonts(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchPopularFonts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyAOES8EmKhuJEnsn9kS1XKBpxxp-TgN8Jc&sort=popularity`
      );
      const data = await response.json();

      // Filter to just include our pre-selected popular fonts
      const filteredFonts = data.items.filter((font: GoogleFont) =>
        POPULAR_GOOGLE_FONTS.includes(font.family)
      );

      setPopularFonts(filteredFonts);
    } catch (error) {
      console.error("Error fetching Google Fonts:", error);
      // Fallback to a static list if API fails
      setPopularFonts(
        POPULAR_GOOGLE_FONTS.map((font) => ({
          family: font,
          variants: ["regular"],
          category: "sans-serif",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const searchGoogleFonts = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyAOES8EmKhuJEnsn9kS1XKBpxxp-TgN8Jc&sort=popularity`
      );
      const data = await response.json();

      // Search through all Google Fonts
      const results = data.items
        .filter((font: GoogleFont) =>
          font.family.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 20); // Limit results to prevent performance issues

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching Google Fonts:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a font for preview
  const loadFontForPreview = (fontFamily: string) => {
    if (loadedFonts.includes(fontFamily)) return;

    try {
      // @ts-ignore - WebFontLoader types might not be properly defined
      window.WebFontConfig = {
        google: {
          families: [`${fontFamily}:${FONT_WEIGHTS_TO_LOAD}`],
        },
        active: () => {
          setLoadedFonts((prev) => [...prev, fontFamily]);
        },
      };

      // Create and append the webfont script
      const wf = document.createElement("script");
      wf.src = `https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js`;
      wf.async = true;
      document.head.appendChild(wf);
    } catch (error) {
      console.error(`Failed to load font: ${fontFamily}`, error);
    }
  };

  // Replace the existing loadFont function calls with loadFontForPreview
  const handlePreviewFont = (fontFamily: string) => {
    loadFont(fontFamily, () => setLoadedFonts((prev) => [...prev, fontFamily]));
  };

  const handleSelectFont = (fontFamily: string) => {
    // Ensure font is loaded with all weights
    loadFont(fontFamily, () => setLoadedFonts((prev) => [...prev, fontFamily]));
    // Update the selected font
    onChange(`${fontFamily}, sans-serif`);
    // Close the modal
    setIsModalOpen(false);
  };

  // Determine which fonts to display
  const displayFonts = searchQuery.trim() !== "" ? searchResults : popularFonts;

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          className="w-full p-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white transition hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300"
          onClick={() => setIsModalOpen(true)}
        >
          <span style={{ fontFamily: value }} className="font-medium">
            {value.split(",")[0].replace(/['"]/g, "")}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-display font-semibold text-gray-900">
                  Select a Google Font
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search from all Google Fonts..."
                className="w-full p-2 border border-gray-300 rounded-md font-primary focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : displayFonts.length === 0 ? (
                <div className="text-center p-8 text-gray-500 font-secondary">
                  {searchQuery.trim() !== ""
                    ? "No fonts found matching your search."
                    : "Loading fonts..."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayFonts.map((font) => {
                    // Load font for preview when it comes into view
                    handlePreviewFont(font.family);
                    return (
                      <button
                        key={font.family}
                        className="p-3 border border-gray-200 rounded-lg text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={() => handleSelectFont(font.family)}
                        onMouseEnter={() => handlePreviewFont(font.family)}
                        style={{
                          fontFamily: loadedFonts.includes(font.family)
                            ? font.family
                            : "sans-serif",
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-base">
                            {font.family}
                          </div>
                          <div className="text-xs text-gray-500 font-secondary">
                            {font.category}
                          </div>
                        </div>
                        <div className="mt-2 text-base text-gray-800">
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md mr-2 font-medium transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSelector;
