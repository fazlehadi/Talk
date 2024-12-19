import { Phone } from "lucide-react";
import { useState, useEffect } from "react";
import DominantColorExtractor from "../utils/dominant-color-extractor";

// The class is now properly imported as DominantColorExtractor

export default function Call() {
  const [dominantColors, setDominantColors] = useState<string[]>([]);

  useEffect(() => {
    // Array of image URLs
    const imageUrls = [
      "https://images.unsplash.com/photo-1512849934327-1cf5bf8a5ccc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZmFjZXN8ZW58MHx8MHx8fDA%3D",
    ];

    // Call the DominantColorExtractor to get the dominant colors for the images
    DominantColorExtractor.getDominantColors(imageUrls)
      .then((colors: string[]) => {
        // Store the array of dominant colors
        setDominantColors(colors);
      })
      .catch((error: Error) => {
        console.error("Error getting dominant colors:", error);
        setDominantColors(["#FFFFFF"]); // Fallback color in case of an error
      });
  }, []);

  return (
    <>
      <div className="h-screen flex relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor:
              dominantColors.length > 0 ? dominantColors[0] : "transparent",
          }}
        ></div>
        <div className="relative z-10 w-full h-full bg-background/20 mt-[50px] flex flex-col items-center py-32">
          <div className="image-container rounded-full h-40 w-40 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1512849934327-1cf5bf8a5ccc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZmFjZXN8ZW58MHx8MHx8fDA%3D"
              alt="callee image"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="username text-[20px] font-semibold mt-8 mb-4">
            pusheen
          </p>
          <p
            className="call-status mb-4"
            // style={{
            //   textShadow:
            //     "1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black",
            // }}
          >
            calling...
          </p>
          <p className="call-duration font-medium">00:56</p>

          <div className="flex items-center space-x-80 mt-96">
            <div className="h-16 w-16 bg-[#14c700] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#11ab00] transition-colors">
              <Phone
                className="h-[24px] w-[24px]"
                strokeWidth={0}
                style={{ fill: "#ffffff" }}
              />
            </div>
            <div className="h-16 w-16 bg-[#e31010] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c71010] transition-colors">
              <Phone
                className="h-[24px] w-[24px] rotate-[135deg]"
                strokeWidth={0}
                style={{ fill: "#ffffff" }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
