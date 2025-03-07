import { useEffect } from "react";

const WebFont = typeof window !== "undefined" ? require("webfontloader") : null;

/**
 * Custom hook to load fonts using WebFontLoader
 * @param fonts Array of font families to load
 */
export function useFontLoader(fonts: string[]) {
  useEffect(() => {
    if (!fonts || fonts.length === 0) return;

    const uniqueFonts = [...new Set(fonts)];

    try {
      WebFont.load({
        google: {
          families: uniqueFonts.map(
            (font) => `${font}:100,200,300,400,500,600,700,800,900`
          ),
        },
        active: () => {
          // Add a data attribute to the document when fonts are loaded
          document.documentElement.setAttribute("data-fonts-loaded", "true");
        },
        inactive: () => {
          console.warn("Failed to load some or all fonts");
        },
      });
    } catch (error) {
      console.error("Error loading fonts:", error);
    }
  }, [fonts]);
}

/**
 * Helper function to load a single font
 * @param fontFamily Font family name
 */
export function loadFont(fontFamily: string, cb?: () => void) {
  if (!fontFamily) return;

  try {
    WebFont.load({
      google: {
        families: [`${fontFamily}:100,200,300,400,500,600,700,800,900`],
      },
      fontactive: () => {
        cb?.();
      },
    });
  } catch (error) {
    console.error(`Failed to load font: ${fontFamily}`, error);
  }
}

export default useFontLoader;
