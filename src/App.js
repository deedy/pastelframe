import React, { useState, useRef, useEffect } from 'react';
import ReactGA from "react-ga4";

ReactGA.initialize("G-ZCMZ5QCRD7"); 


const PastelFrame = () => {
  const [image, setImage] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('#C2A6B5');
  const [borderColor, setBorderColor] = useState('');
  const [borderWidth, setBorderWidth] = useState({ top: 50, right: 50, bottom: 50, left: 50 });
  const [hasPadding, setHasPadding] = useState(true);
  const [hasDropShadow, setHasDropShadow] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [initialBorderWidth, setInitialBorderWidth] = useState(null);
  const [initialMousePos, setInitialMousePos] = useState(null);
  const [isPasting, setIsPasting] = useState(false);

  const pastelColors = [
    '#C2A6B5', '#A6B5C2', '#B5C2A6', '#C2B5A6', '#A6C2B5', 
    '#B5A6C2', '#8E9AAF', '#AFB3A4', '#A4AFB3', '#AFA48E',
    'linear-gradient(to right, #ffecd2, #fcb69f)',
    'linear-gradient(to right, #d4fc79, #96e6a1)',
    'linear-gradient(to right, #84fab0, #8fd3f4)',
    'linear-gradient(to right, #a6c0fe, #f68084)',
    'linear-gradient(to right, #fbc2eb, #a6c1ee)'
  ];

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  useEffect(() => {
    const handlePaste = (e) => {
      setIsPasting(false);
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        setIsPasting(true);
      }
    };

    const handleKeyUp = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        setIsPasting(false);
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {

    const drawImage = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const padding = hasPadding ? 20 : 0;
      const cornerRadius = 15;

      // Make these percentages of the viewport
      const maxWidthPercentage = 0.9; // 90% of viewport width
      const maxHeightPercentage = 0.7; // 70% of viewport height

      const maxWidth = window.innerWidth * maxWidthPercentage - 2*padding;
      const maxHeight = window.innerHeight * maxHeightPercentage - 2*padding;

      // Set a minimum size
      const minWidth = 300;
      const minHeight = 200;

      let newWidth = image ? image.width : 700;
      let newHeight = image ? image.height : 300;

      // Calculate aspect ratio
      const aspectRatio = newWidth / newHeight;

      // Adjust dimensions based on max width and height
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
      }

      // Ensure minimum size
      newWidth = Math.max(newWidth, minWidth);
      newHeight = Math.max(newHeight, minHeight);

      // Adjust canvas size
      canvas.width = newWidth + padding * 2 + borderWidth.left + borderWidth.right;
      canvas.height = newHeight + padding * 2 + borderWidth.top + borderWidth.bottom;

      if (hasDropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw background
      const backgroundGradient = createGradient(ctx, backgroundColor, canvas.width, canvas.height);
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);


      // Draw border
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(borderWidth.left, cornerRadius + borderWidth.top);
      ctx.arcTo(borderWidth.left, borderWidth.top, cornerRadius + borderWidth.left, borderWidth.top, cornerRadius);
      ctx.lineTo(canvas.width - cornerRadius - borderWidth.right, borderWidth.top);
      ctx.arcTo(canvas.width - borderWidth.right, borderWidth.top, canvas.width - borderWidth.right, cornerRadius + borderWidth.top, cornerRadius);
      ctx.lineTo(canvas.width - borderWidth.right, canvas.height - cornerRadius - borderWidth.bottom);
      ctx.arcTo(canvas.width - borderWidth.right, canvas.height - borderWidth.bottom, canvas.width - cornerRadius - borderWidth.right, canvas.height - borderWidth.bottom, cornerRadius);
      ctx.lineTo(cornerRadius + borderWidth.left, canvas.height - borderWidth.bottom);
      ctx.arcTo(borderWidth.left, canvas.height - borderWidth.bottom, borderWidth.left, canvas.height - cornerRadius - borderWidth.bottom, cornerRadius);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (!hasPadding) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(borderWidth.left + cornerRadius, borderWidth.top);
        ctx.arcTo(borderWidth.left + newWidth, borderWidth.top, borderWidth.left + newWidth, borderWidth.top + cornerRadius, cornerRadius);
        ctx.arcTo(borderWidth.left + newWidth, borderWidth.top + newHeight, borderWidth.left + newWidth - cornerRadius, borderWidth.top + newHeight, cornerRadius);
        ctx.arcTo(borderWidth.left, borderWidth.top + newHeight, borderWidth.left, borderWidth.top + newHeight - cornerRadius, cornerRadius);
        ctx.arcTo(borderWidth.left, borderWidth.top, borderWidth.left + cornerRadius, borderWidth.top, cornerRadius);
        ctx.closePath();
        ctx.clip();
      }

      if (!image) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
        ctx.fillRect(
          borderWidth.left + padding, 
          borderWidth.top + padding, 
          newWidth, 
          newHeight
        );
      } else {
        ctx.drawImage(image, borderWidth.left + padding, borderWidth.top + padding, newWidth, newHeight);
      }

      if (!hasPadding) {
        ctx.restore();
      }
    };
    
    drawImage(); 
    const handleResize = () => {
      drawImage();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [image, backgroundColor, borderColor, borderWidth, hasPadding, hasDropShadow]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setBorderColor(getAverageColor(img));
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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let r = 0, g = 0, b = 0;
      let count = 0;

      // Define the 20% border dimensions
      const borderX = Math.floor(canvas.width * 0.2);
      const borderY = Math.floor(canvas.height * 0.2);

      for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
              // Check if the current pixel is within the border area
              if (x < borderX || x >= canvas.width - borderX || y < borderY || y >= canvas.height - borderY) {
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
    if (color.startsWith('linear-gradient')) {
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
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'pastelframe-image.png';
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
      navigator.clipboard.write([item]).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }, (error) => {
        console.error("Error copying image to clipboard:", error);
      });
    });
    ReactGA.event({
      category: "User Interaction",
      action: "Copied to Clipboard",
    });
  };

  const handleMouseDown = (e, direction) => {
    setIsDragging(direction);
    setInitialBorderWidth({...borderWidth});
    setInitialMousePos({x: e.clientX, y: e.clientY});
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && initialMousePos) {
        const dx = e.clientX - initialMousePos.x;
        const dy = e.clientY - initialMousePos.y;

        setBorderWidth(prev => {
          const newBorderWidth = { ...prev };
          switch (isDragging) {
            case 'top':
            case 'bottom':
              const totalVerticalChange = Math.max(40, Math.min(300, initialBorderWidth.top + initialBorderWidth.bottom + dy * (isDragging === 'bottom' ? 2 : -2)));
              newBorderWidth.top = totalVerticalChange / 2;
              newBorderWidth.bottom = totalVerticalChange / 2;
              break;
            case 'left':
            case 'right':
              const totalHorizontalChange = Math.max(40, Math.min(300, initialBorderWidth.left + initialBorderWidth.right + dx * (isDragging === 'right' ? 2 : -2)));
              newBorderWidth.left = totalHorizontalChange / 2;
              newBorderWidth.right = totalHorizontalChange / 2;
              break;
            default:
              break;
          }
          return newBorderWidth;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      setInitialMousePos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, initialBorderWidth, initialMousePos]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: isDarkMode ? '#2C3E50' : '#ECF0F1',
      color: isDarkMode ? '#ECF0F1' : '#2C3E50',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>PastelFrame.io</h1>
      
      {!imageUploaded && (<div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        height: '60px',
        border: `2px dashed ${isDarkMode ? '#ECF0F1' : '#2C3E50'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <input 
          type="file" 
          onChange={handleImageUpload} 
          accept="image/*" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            border: isPasting ? '2px solid #3498DB' : '2px dashed #A6A6A6',
            transition: 'border 0.3s ease'
          }} 
        />
        <span style={{
          pointerEvents: 'none',
          transition: 'color 0.3s ease'
        }}>
          {isPasting ? 'Pasting...' : 'Choose an image, drag it here, or paste'}
        </span>
      </div>)}

      
        <div style={{position: 'relative', marginBottom: '1.5rem'}}>
          <canvas ref={canvasRef} style={{boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)', borderRadius: '8px'}} />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              width: '20px',
              height: '20px',
              backgroundColor: '#8E9AAF',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              cursor: 'ns-resize'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'top')}
          />
          <div
            style={{
              position: 'absolute',
              right: '-10px',
              top: '50%',
              width: '20px',
              height: '20px',
              backgroundColor: '#8E9AAF',
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              cursor: 'ew-resize'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              width: '20px',
              height: '20px',
              backgroundColor: '#8E9AAF',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              cursor: 'ns-resize'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          />
          <div
            style={{
              position: 'absolute',
              left: '-10px',
              top: '50%',
              width: '20px',
              height: '20px',
              backgroundColor: '#8E9AAF',
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              cursor: 'ew-resize'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />
        </div>
      

      
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '600px',
          padding: '1rem',
          backgroundColor: isDarkMode ? '#34495E' : '#D6EAF8',
          borderRadius: '8px',
          transition: 'background-color 0.3s'
        }}>
          <div>
            <label htmlFor="background-color" style={{display: 'block', marginBottom: '0.5rem'}}>Background Color</label>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
              {pastelColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setBackgroundColor(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    background: color,
                    border: color === backgroundColor ? `2px solid ${isDarkMode ? '#ECF0F1' : '#2C3E50'}` : 'none',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <label style={{display: 'flex', alignItems: 'center'}}>
              <input
                type="checkbox"
                checked={hasPadding}
                onChange={(e) => setHasPadding(e.target.checked)}
                style={{marginRight: '0.5rem'}}
              />
              Add Padding
            </label>
            <label style={{display: 'flex', alignItems: 'center'}}>
              <input
                type="checkbox"
                checked={hasDropShadow}
                onChange={(e) => setHasDropShadow(e.target.checked)}
                style={{marginRight: '0.5rem'}}
              />
              Add Drop Shadow
            </label>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button 
              onClick={handleDownload} 
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isDarkMode ? '#3498DB' : '#2980B9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = isDarkMode ? '#2980B9' : '#3498DB'}
              onMouseOut={(e) => e.target.style.backgroundColor = isDarkMode ? '#3498DB' : '#2980B9'}
            >
              Download
            </button>
            <button 
              onClick={handleCopyToClipboard} 
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isCopied ? '#27AE60' : (isDarkMode ? '#3498DB' : '#2980B9'),
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (!isCopied) e.target.style.backgroundColor = isDarkMode ? '#2980B9' : '#3498DB';
              }}
              onMouseOut={(e) => {
                if (!isCopied) e.target.style.backgroundColor = isDarkMode ? '#3498DB' : '#2980B9';
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
                style={{marginRight: '0.5rem'}}
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
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.9rem',
        backgroundColor: isDarkMode ? '#34495E' : '#D6EAF8',
        color: isDarkMode ? '#ECF0F1' : '#2C3E50',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}>
        <a 
          href="https://debarghyadas.com/?" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isDarkMode ? '#3498DB' : '#2980B9'
          }}></span>
          Made by Deedy
        </a>
      </div>

      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>{isDarkMode ? 'Dark' : 'Light'} Mode</span>
        <label style={{
          display: 'inline-block',
          width: '60px',
          height: '34px',
          position: 'relative'
        }}>
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            style={{
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <span style={{
            position: 'absolute',
            cursor: 'pointer',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode ? '#3498DB' : '#95A5A6',
            transition: '0.4s',
            borderRadius: '34px'
          }}>
            <span style={{
              position: 'absolute',
              content: '""',
              height: '26px',
              width: '26px',
              left: '4px',
              bottom: '4px',
              backgroundColor: 'white',
              transition: '0.4s',
              borderRadius: '50%',
              transform: isDarkMode ? 'translateX(26px)' : 'translateX(0)'
            }} />
          </span>
        </label>
      </div>
    </div>
  );
};

export default PastelFrame;