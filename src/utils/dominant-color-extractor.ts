class DominantColorExtractor {
  // Function to calculate the average color of an image
  static calculateAverageColor(imageData: ImageData): string {
    let r = 0,
      g = 0,
      b = 0;
    let count = 0;
    const step = Math.ceil(imageData.data.length / 40000) * 4;

    for (let i = 0; i < imageData.data.length; i += step) {
      if (
        imageData.data[i] !== 255 ||
        imageData.data[i + 1] !== 255 ||
        imageData.data[i + 2] !== 255
      ) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
        count++;
      }
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    return `rgb(${r}, ${g}, ${b})`;
  }

  // Function to get dominant color from an array of images
  static async getDominantColors(imageUrls: string[]): Promise<string[]> {
    const dominantColors: string[] = [];

    for (const url of imageUrls) {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Handle CORS if needed

      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image failed to load"));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // Calculate the dominant color
        const dominantColor =
          DominantColorExtractor.calculateAverageColor(imageData);
        dominantColors.push(dominantColor);
      }
    }

    return dominantColors;
  }
}

export default DominantColorExtractor;
