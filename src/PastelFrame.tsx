import React, { useState, useRef, useEffect } from "react";
import ReactGA from "react-ga4";
import quantize from "quantize";
import "./PastelFrame.css";

ReactGA.initialize("G-ZCMZ5QCRD7");

const Toggle = ({ checked, onChange, label }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider"></span>
    <span className="toggle-label">{label}</span>
  </label>
);

const PastelFrame = () => {
  const [image, setImage] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("#C2A6B5");
  const [borderColor, setBorderColor] = useState("");
  const [borderWidth, setBorderWidth] = useState({
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  });
  const [hasPadding, setHasPadding] = useState(true);
  const [hasDropShadow, setHasDropShadow] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [initialBorderWidth, setInitialBorderWidth] = useState(null);
  const [initialTouchPos, setInitialTouchPos] = useState(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isImageBackgroundRemoved, setIsImageBackgroundRemoved] =
    useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [threshold, setThreshold] = useState(30);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pastelColors, setPastelColors] = useState([
    "#FF9AA2", // Bold pastel pink
    "#FFB7B2", // Bold pastel peach
    "#FFDAC1", // Bold pastel orange
    "#E2F0CB", // Bold pastel lime
    "#B5EAD7", // Bold pastel mint
    "#C7CEEA", // Bold pastel periwinkle
    "#FF85A1", // Bold pastel rose
    "#FFC300", // Bold pastel yellow
    "linear-gradient(to right, #B5EAD7, #C7CEEA)", // Bold mint to periwinkle gradient
    "linear-gradient(to right, #FFB7B2, #FF85A1)", // Bold peach to rose gradient
    "linear-gradient(to right, #E2F0CB, #DAF7A6)", // Bold lime to green gradient
    "#1A1A1A",
    "#FFFFFF",
  ]);

  // Set a minimum size
  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 300;
  const MIN_BORDER_WIDTH = 20;

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  useEffect(() => {
    if (image) {
      setImageSize({ width: image.width, height: image.height });
    }
  }, [image]);

  useEffect(() => {
    const handlePaste = (e) => {
      setIsPasting(false);
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              setImage(img);
              setBorderColor(getAverageColor(img));
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        setIsPasting(true);
      }
    };

    const handleKeyUp = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        setIsPasting(false);
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const removeImageBackground = async (img, threshold) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Detect the background color (same as before)
      const cornerPixels = [
        { r: data[0], g: data[1], b: data[2] },
        {
          r: data[4 * (canvas.width - 1)],
          g: data[4 * (canvas.width - 1) + 1],
          b: data[4 * (canvas.width - 1) + 2],
        },
        {
          r: data[4 * (canvas.width * (canvas.height - 1))],
          g: data[4 * (canvas.width * (canvas.height - 1)) + 1],
          b: data[4 * (canvas.width * (canvas.height - 1)) + 2],
        },
        {
          r: data[4 * (canvas.width * canvas.height - 1)],
          g: data[4 * (canvas.width * canvas.height - 1) + 1],
          b: data[4 * (canvas.width * canvas.height - 1) + 2],
        },
      ];

      const avgBackgroundColor = cornerPixels.reduce(
        (acc, pixel) => {
          acc.r += pixel.r;
          acc.g += pixel.g;
          acc.b += pixel.b;
          return acc;
        },
        { r: 0, g: 0, b: 0 },
      );

      avgBackgroundColor.r = Math.round(avgBackgroundColor.r / 4);
      avgBackgroundColor.g = Math.round(avgBackgroundColor.g / 4);
      avgBackgroundColor.b = Math.round(avgBackgroundColor.b / 4);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Use the provided threshold
        if (
          Math.abs(r - avgBackgroundColor.r) < threshold &&
          Math.abs(g - avgBackgroundColor.g) < threshold &&
          Math.abs(b - avgBackgroundColor.b) < threshold
        ) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const dataURL = canvas.toDataURL("image/png");
      const processedImg = new Image();
      processedImg.onload = () => {
        resolve(processedImg);
      };
      processedImg.src = dataURL;
    });
  };

  useEffect(() => {
    const processImage = async () => {
      if (image && isImageBackgroundRemoved) {
        const processed = await removeImageBackground(image, threshold);
        setProcessedImage(processed);
      } else {
        setProcessedImage(null);
      }
    };

    processImage();
  }, [image, isImageBackgroundRemoved, threshold]); // Add threshold to dependencies

  const handleThresholdChange = (event) => {
    setThreshold(Number(event.target.value));
  };

  useEffect(() => {
    if (image && isImageBackgroundRemoved) {
      removeImageBackground(image, threshold).then(setProcessedImage);
    } else {
      setProcessedImage(null);
    }
  }, [image, isImageBackgroundRemoved, threshold]);

  useEffect(() => {
    const drawImage = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const padding = hasPadding ? 20 : 0;
      const cornerRadius = 15;

      // Make these percentages of the viewport
      const maxWidthPercentage = 0.9; // 90% of viewport width
      const maxHeightPercentage = 0.7; // 70% of viewport height

      const maxWidth = window.innerWidth * maxWidthPercentage - 2 * padding;
      const maxHeight = window.innerHeight * maxHeightPercentage - 2 * padding;

      let newWidth = image ? imageSize.width : maxWidth;
      let newHeight = image ? imageSize.height : maxHeight;

      // Adjust canvas size based on border width
      const totalWidth =
        newWidth + padding * 2 + borderWidth.left + borderWidth.right;
      const totalHeight =
        newHeight + padding * 2 + borderWidth.top + borderWidth.bottom;

      // Adjust dimensions if total size exceeds max width or height
      if (totalWidth > maxWidth || totalHeight > maxHeight) {
        const scaleX = maxWidth / totalWidth;
        const scaleY = maxHeight / totalHeight;
        const scale = Math.min(scaleX, scaleY);

        newWidth *= scale;
        newHeight *= scale;
      }

      // Ensure the new dimensions do not fall below the minimum values
      if (newWidth < MIN_WIDTH || newHeight < MIN_HEIGHT) {
        // Calculate the minimum scaling factors to meet minimum dimensions
        const minScaleX = MIN_WIDTH / newWidth;
        const minScaleY = MIN_HEIGHT / newHeight;

        // Use the larger scaling factor to maintain the minimum size while preserving aspect ratio
        const minScale = Math.max(minScaleX, minScaleY);

        // Apply the minimum scale to both width and height
        newWidth = newWidth * minScale;
        newHeight = newHeight * minScale;
      }

      // Set canvas size
      canvas.width =
        newWidth + padding * 2 + borderWidth.left + borderWidth.right;
      canvas.height =
        newHeight + padding * 2 + borderWidth.top + borderWidth.bottom;

      if (hasDropShadow) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw background
      const backgroundGradient = createGradient(
        ctx,
        backgroundColor,
        canvas.width,
        canvas.height,
      );
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isImageBackgroundRemoved) {
        // Draw border
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(borderWidth.left, cornerRadius + borderWidth.top);
        ctx.arcTo(
          borderWidth.left,
          borderWidth.top,
          cornerRadius + borderWidth.left,
          borderWidth.top,
          cornerRadius,
        );
        ctx.lineTo(
          canvas.width - cornerRadius - borderWidth.right,
          borderWidth.top,
        );
        ctx.arcTo(
          canvas.width - borderWidth.right,
          borderWidth.top,
          canvas.width - borderWidth.right,
          cornerRadius + borderWidth.top,
          cornerRadius,
        );
        ctx.lineTo(
          canvas.width - borderWidth.right,
          canvas.height - cornerRadius - borderWidth.bottom,
        );
        ctx.arcTo(
          canvas.width - borderWidth.right,
          canvas.height - borderWidth.bottom,
          canvas.width - cornerRadius - borderWidth.right,
          canvas.height - borderWidth.bottom,
          cornerRadius,
        );
        ctx.lineTo(
          cornerRadius + borderWidth.left,
          canvas.height - borderWidth.bottom,
        );
        ctx.arcTo(
          borderWidth.left,
          canvas.height - borderWidth.bottom,
          borderWidth.left,
          canvas.height - cornerRadius - borderWidth.bottom,
          cornerRadius,
        );
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (!hasPadding) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(borderWidth.left + cornerRadius, borderWidth.top);
        ctx.arcTo(
          borderWidth.left + newWidth,
          borderWidth.top,
          borderWidth.left + newWidth,
          borderWidth.top + cornerRadius,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left + newWidth,
          borderWidth.top + newHeight,
          borderWidth.left + newWidth - cornerRadius,
          borderWidth.top + newHeight,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left,
          borderWidth.top + newHeight,
          borderWidth.left,
          borderWidth.top + newHeight - cornerRadius,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left,
          borderWidth.top,
          borderWidth.left + cornerRadius,
          borderWidth.top,
          cornerRadius,
        );
        ctx.closePath();
        ctx.clip();
      }

      if (image) {
        const imageToDraw =
          isImageBackgroundRemoved && processedImage ? processedImage : image;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(
          borderWidth.left + padding + cornerRadius,
          borderWidth.top + padding,
        );
        ctx.arcTo(
          borderWidth.left + padding + newWidth,
          borderWidth.top + padding,
          borderWidth.left + padding + newWidth,
          borderWidth.top + padding + cornerRadius,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left + padding + newWidth,
          borderWidth.top + padding + newHeight,
          borderWidth.left + padding + newWidth - cornerRadius,
          borderWidth.top + padding + newHeight,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left + padding,
          borderWidth.top + padding + newHeight,
          borderWidth.left + padding,
          borderWidth.top + padding + newHeight - cornerRadius,
          cornerRadius,
        );
        ctx.arcTo(
          borderWidth.left + padding,
          borderWidth.top + padding,
          borderWidth.left + padding + cornerRadius,
          borderWidth.top + padding,
          cornerRadius,
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          imageToDraw,
          borderWidth.left + padding,
          borderWidth.top + padding,
          newWidth,
          newHeight,
        );
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.0)";
        ctx.fillRect(
          borderWidth.left + padding,
          borderWidth.top + padding,
          newWidth,
          newHeight,
        );
      }

      if (!hasPadding) {
        ctx.restore();
      }
    };

    drawImage();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      drawImage();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    image,
    imageSize,
    backgroundColor,
    borderColor,
    borderWidth,
    hasPadding,
    hasDropShadow,
    isImageBackgroundRemoved,
    processedImage,
  ]);

  const extractColors = (imageData, numColors = 8) => {
    const pixels = imageData.data;
    const pixelArray = [];

    for (let i = 0; i < pixels.length; i += 4) {
      pixelArray.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }

    const colorMap = quantize(pixelArray, numColors);
    const palette = colorMap.palette();

    const rgbToHsl = (r, g, b) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h,
        s,
        l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return [h * 360, s * 100, l * 100];
    };

    const hslToHex = (h, s, l) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const hslColors = palette.map((color) => rgbToHsl(...color));

    // Sort colors by luminance
    hslColors.sort((a, b) => a[2] - b[2]);

    // Select diverse colors
    const selectedColors = [];
    const luminanceRanges = [
      [0, 20], // Very dark
      [20, 40], // Dark
      [40, 60], // Medium
      [60, 80], // Light
      [80, 100], // Very light
    ];

    luminanceRanges.forEach((range) => {
      const colorsInRange = hslColors.filter(
        (color) => color[2] >= range[0] && color[2] < range[1],
      );
      if (colorsInRange.length > 0) {
        selectedColors.push(
          colorsInRange[Math.floor(colorsInRange.length / 2)],
        );
      }
    });

    // If we have less than numColors, add more from the original palette
    while (selectedColors.length < numColors - 2 && hslColors.length > 0) {
      selectedColors.push(hslColors.pop());
    }

    // Create gradients
    const gradients = [];
    for (
      let i = 0;
      i < selectedColors.length - 1 && gradients.length < 2;
      i++
    ) {
      const color1 = selectedColors[i];
      const color2 = selectedColors[i + 1];
      gradients.push(
        `linear-gradient(to right, ${hslToHex(...color1)}, ${hslToHex(...color2)})`,
      );
    }

    // Convert selected colors to hex
    const hexColors = selectedColors.map((color) => hslToHex(...color));

    // Combine solid colors and gradients
    const finalColors = [...hexColors, ...gradients];

    // Ensure we return exactly numColors
    return finalColors.slice(0, numColors);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setBorderColor(getAverageColor(img));
        // Extract theme colors
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const extractedColors = extractColors(imageData);

        // Update pastelColors array
        setPastelColors((prevColors) => {
          const newColors = [...prevColors];
          extractedColors.forEach((color) => {
            if (!newColors.includes(color)) {
              newColors.push(color);
            }
          });
          return newColors;
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    setImageUploaded(true);
    ReactGA.event({
      category: "User Interaction",
      action: "Uploaded Image",
    });
  };

  const getAverageColor = (img) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let r = 0,
      g = 0,
      b = 0;
    let count = 0;

    // Define the 20% border dimensions
    const borderX = Math.floor(canvas.width * 0.1);
    const borderY = Math.floor(canvas.height * 0.1);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Check if the current pixel is within the border area
        if (
          x < borderX ||
          x >= canvas.width - borderX ||
          y < borderY ||
          y >= canvas.height - borderY
        ) {
          const index = (y * canvas.width + x) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count++;
        }
      }
    }

    // Calculate the average color
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    return `rgb(${r},${g},${b})`;
  };

  const createGradient = (ctx, color, width, height) => {
    if (color.startsWith("linear-gradient")) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      const colors = color.match(/#[a-fA-F0-9]{6}/g);
      if (colors && colors.length === 2) {
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
      }
      return gradient;
    }
    return color;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "pastelframe-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ReactGA.event({
      category: "User Interaction",
      action: "Downloaded Image",
    });
  };

  const handleCopyToClipboard = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then(
        () => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        },
        (error) => {
          console.error("Error copying image to clipboard:", error);
        },
      );
    });
    ReactGA.event({
      category: "User Interaction",
      action: "Copied to Clipboard",
    });
  };

  const handleResizeStart = (e, direction) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    setIsDragging(direction);
    setInitialBorderWidth({ ...borderWidth });
    if (e.type === "mousedown") {
      setInitialTouchPos({ x: e.clientX, y: e.clientY });
    } else if (e.type === "touchstart") {
      setInitialTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  useEffect(() => {
    const minBorderWidth = 20;

    const handleResize = (e) => {
      if (isDragging && initialTouchPos) {
        let clientX, clientY;
        if (e.type === "mousemove") {
          clientX = e.clientX;
          clientY = e.clientY;
        } else if (e.type === "touchmove") {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }

        const dx = clientX - initialTouchPos.x;
        const dy = clientY - initialTouchPos.y;

        let newBorderWidth = { ...borderWidth };

        switch (isDragging) {
          case "top":
          case "bottom":
            const totalVerticalChange = Math.max(
              0,
              initialBorderWidth.top +
                initialBorderWidth.bottom +
                dy * (isDragging === "bottom" ? 2 : -2),
            );
            newBorderWidth.top = Math.max(
              minBorderWidth,
              totalVerticalChange / 2,
            );
            newBorderWidth.bottom = Math.max(
              minBorderWidth,
              totalVerticalChange / 2,
            );
            break;
          case "left":
          case "right":
            const totalHorizontalChange = Math.max(
              0,
              initialBorderWidth.left +
                initialBorderWidth.right +
                dx * (isDragging === "right" ? 2 : -2),
            );
            newBorderWidth.left = Math.max(
              minBorderWidth,
              totalHorizontalChange / 2,
            );
            newBorderWidth.right = Math.max(
              minBorderWidth,
              totalHorizontalChange / 2,
            );
            break;
          default:
            break;
        }

        setBorderWidth(newBorderWidth);

        setImageSize((prev) => {
          const newSize = { ...prev };
          const aspectRatio = prev.width / prev.height;

          if (isDragging === "top" || isDragging === "bottom") {
            if (newBorderWidth.top <= MIN_BORDER_WIDTH) {
              const heightDiff = dy * (isDragging === "bottom" ? -2 : 2);
              let newHeight = Math.max(
                MIN_HEIGHT,
                imageSize.height - 2 * heightDiff,
              );
              let newWidth = newHeight * aspectRatio;
              if (newWidth < MIN_WIDTH) {
                newWidth = MIN_WIDTH;
                newHeight = newWidth / aspectRatio;
              }
              newSize.width = newWidth;
              newSize.height = newHeight;
            }
          } else if (isDragging === "left" || isDragging === "right") {
            if (newBorderWidth.left <= MIN_BORDER_WIDTH) {
              const widthDiff = dx * (isDragging === "right" ? -2 : 2);

              let newWidth = Math.max(
                MIN_WIDTH,
                imageSize.width - 2 * widthDiff,
              );
              let newHeight = newWidth / aspectRatio;
              if (newHeight < MIN_HEIGHT) {
                newHeight = MIN_HEIGHT;
                newWidth = newHeight * aspectRatio;
              }
              newSize.width = newWidth;
              newSize.height = newHeight;
            }
          }
          return newSize;
        });
      }
    };
    const handleResizeEnd = () => {
      setIsDragging(null);
      setInitialTouchPos(null);
    };

    window.addEventListener("mousemove", handleResize);
    window.addEventListener("touchmove", handleResize);
    window.addEventListener("mouseup", handleResizeEnd);
    window.addEventListener("touchend", handleResizeEnd);

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("touchmove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [imageSize, isDragging, initialBorderWidth, initialTouchPos, borderWidth]);

  const dragButtonStyle = (position, isHovered) => ({
    position: "absolute",
    width: "20px",
    height: "20px",
    backgroundColor: "#8E9AAF",
    borderRadius: "50%",
    cursor: isDragging ? "grabbing" : "grab",
    transition: "transform 0.2s, width 0.2s, height 0.2s",
    zIndex: 10,
    ...position,
    transform: `${position.transform} ${isHovered ? "scale(1.5)" : "scale(1)"}`,
  });

  const renderDragButton = (position, direction) => (
    <div
      style={dragButtonStyle(position, hoveredButton === direction)}
      onMouseDown={(e) => handleResizeStart(e, direction)}
      onTouchStart={(e) => handleResizeStart(e, direction)}
      onMouseEnter={() => setHoveredButton(direction)}
      onMouseLeave={() => setHoveredButton(null)}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        backgroundColor: isDarkMode ? "#2C3E50" : "#ECF0F1",
        color: isDarkMode ? "#ECF0F1" : "#2C3E50",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
        }}
      >
        PastelFrame.io
      </h1>

      {!imageUploaded && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "600px",
            height: "60px",
            border: `2px dashed ${isDarkMode ? "#ECF0F1" : "#2C3E50"}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginBottom: "1.5rem",
          }}
        >
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              border: isPasting ? "2px solid #3498DB" : "2px dashed #A6A6A6",
              transition: "border 0.3s ease",
            }}
          />
          <span
            style={{
              pointerEvents: "none",
              transition: "color 0.3s ease",
            }}
          >
            {isPasting
              ? "Pasting..."
              : "Choose an image, drag it here, or paste"}
          </span>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px",
          }}
        />
        {renderDragButton(
          { right: "-10px", top: "50%", transform: "translateY(-50%)" },
          "right",
        )}
        {renderDragButton(
          { bottom: "-10px", left: "50%", transform: "translateX(-50%)" },
          "bottom",
        )}
        {renderDragButton(
          { left: "-10px", top: "50%", transform: "translateY(-50%)" },
          "left",
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: isMobile ? "300px" : "600px",
          padding: "1rem",
          backgroundColor: isDarkMode ? "#34495E" : "#D6EAF8",
          borderRadius: "8px",
          transition: "background-color 0.3s",
        }}
      >
        <div>
          <label
            htmlFor="background-color"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Background Color
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {pastelColors.map((color, index) => (
              <button
                key={index}
                onClick={() => setBackgroundColor(color)}
                style={{
                  width: "30px",
                  height: "30px",
                  background: color,
                  border:
                    color === backgroundColor
                      ? `2px solid ${isDarkMode ? "#ECF0F1" : "#2C3E50"}`
                      : "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: isMobile ? "0.5rem" : "1rem",
          }}
        >
          <Toggle
            checked={hasPadding}
            onChange={(e) => setHasPadding(e.target.checked)}
            label="Add Padding"
          />
          <Toggle
            checked={isImageBackgroundRemoved}
            onChange={(e) => setIsImageBackgroundRemoved(e.target.checked)}
            label="Remove Background"
          />
          <Toggle
            checked={hasDropShadow}
            onChange={(e) => setHasDropShadow(e.target.checked)}
            label="Add Drop Shadow"
          />
        </div>
        {isImageBackgroundRemoved && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label htmlFor="threshold-slider">Threshold: {threshold}</label>
            <input
              id="threshold-slider"
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={handleThresholdChange}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: isDarkMode ? "#3498DB" : "#2980B9",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = isDarkMode
                ? "#2980B9"
                : "#3498DB")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = isDarkMode
                ? "#3498DB"
                : "#2980B9")
            }
          >
            Download
          </button>
          <button
            onClick={handleCopyToClipboard}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: isCopied
                ? "#27AE60"
                : isDarkMode
                  ? "#3498DB"
                  : "#2980B9",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background-color 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              if (!isCopied)
                e.target.style.backgroundColor = isDarkMode
                  ? "#2980B9"
                  : "#3498DB";
            }}
            onMouseOut={(e) => {
              if (!isCopied)
                e.target.style.backgroundColor = isDarkMode
                  ? "#3498DB"
                  : "#2980B9";
            }}
            disabled={isCopied}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "0.5rem" }}
            >
              {isCopied ? (
                <>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </>
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </>
              )}
            </svg>
            {isCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "1rem",
          fontFamily: "Arial, sans-serif",
          fontSize: "0.9rem",
          backgroundColor: isDarkMode ? "#34495E" : "#D6EAF8",
          color: isDarkMode ? "#ECF0F1" : "#2C3E50",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
        }}
      >
        <a
          href="https://debarghyadas.com/?"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "inherit",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: isDarkMode ? "#3498DB" : "#2980B9",
            }}
          ></span>
          Made by Deedy
        </a>
      </div>

      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>{isDarkMode ? "Dark" : "Light"} Mode</span>
        <label
          style={{
            display: "inline-block",
            width: "60px",
            height: "34px",
            position: "relative",
          }}
        >
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            style={{
              opacity: 0,
              width: 0,
              height: 0,
            }}
          />
          <span
            style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDarkMode ? "#3498DB" : "#95A5A6",
              transition: "0.4s",
              borderRadius: "34px",
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "26px",
                width: "26px",
                left: "4px",
                bottom: "4px",
                backgroundColor: "white",
                transition: "0.4s",
                borderRadius: "50%",
                transform: isDarkMode ? "translateX(26px)" : "translateX(0)",
              }}
            />
          </span>
        </label>
      </div>
    </div>
  );
};

export default PastelFrame;
