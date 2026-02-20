import React, { useState, useEffect, startTransition } from "react";

// SVG Icons
const SunIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" fill={color} />
    <path
      d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} />
  </svg>
);

// Utility function to apply color to custom SVG
const applyColorToSvg = (svgString, color) => {
  if (!svgString) return "";
  let modifiedSvg = svgString.replace(/fill="[^"]*"/g, `fill="${color}"`);
  modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
  if (!svgString.includes("fill=") && !svgString.includes("stroke=")) {
    modifiedSvg = modifiedSvg.replace(
      /<(path|circle|rect|ellipse|polygon|polyline)([^>]*?)>/g,
      `<$1$2 fill="${color}">`
    );
  }
  return modifiedSvg;
};

// Custom SVG component
const CustomIcon = ({ svgString, size, color }) => {
  const coloredSvg = applyColorToSvg(svgString, color);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      dangerouslySetInnerHTML={{ __html: coloredSvg }}
    />
  );
};

export default function ThemeToggleButton({
  toggleTheme,
  isDarkMode,
  toggleType = "Button",
  lightIconColor = "#FF8C00",
  darkIconColor = "#949494",
  SunIconColor = "#FF9100",
  MoonIconColor = "#6B6B6B",
  size = 30, // Adjusted default size
  switchTrackColor = "#424242",
  switchActiveColor = "#DBDBDB",
  sunSvg,
  moonSvg,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (toggleTheme) toggleTheme();
  };

  const isLightMode = !isDarkMode;
  const buttonIconSize = size * 0.8;

  // Button Style Toggle
  if (toggleType === "Button") {
    return (
      <div
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.3s ease",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 0,
          width: size, // Use size prop or 100%
          height: size,
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            setIsHovered(true);
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            setIsHovered(false);
        }}
        title={isLightMode ? "Passer en mode sombre" : "Passer en mode clair"}
      >
        {isLightMode ? (
          sunSvg ? (
            <CustomIcon svgString={sunSvg} size={buttonIconSize} color={lightIconColor} />
          ) : (
            <SunIcon size={buttonIconSize} color={lightIconColor} />
          )
        ) : moonSvg ? (
          <CustomIcon svgString={moonSvg} size={buttonIconSize} color={darkIconColor} />
        ) : (
          <MoonIcon size={buttonIconSize} color={darkIconColor} />
        )}
      </div>
    );
  }

  // Switch Style Toggle
  const switchWidth = size * 1.8;
  const switchHeight = size * 1;
  const knobSize = switchHeight * 0.8;
  const knobIconSize = knobSize * 0.6;
  const borderRadius = switchHeight / 2;

  return (
    <button
      type="button"
      aria-pressed={isLightMode}
      onClick={handleClick}
      style={{
        width: switchWidth,
        height: switchHeight,
        background: isLightMode ? switchActiveColor : switchTrackColor,
        border: "none",
        borderRadius: borderRadius,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        boxShadow: isLightMode
          ? "0 1px 3px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.10)",
        outline: "none",
        padding: 0,
        display: 'block'
      }}
      title={isLightMode ? "Passer en mode sombre" : "Passer en mode clair"}
    >
      <span
        style={{
          position: "absolute",
          top: (switchHeight - knobSize) / 2,
          left: isLightMode
            ? switchWidth - knobSize - (switchHeight - knobSize) / 2
            : (switchHeight - knobSize) / 2,
          width: knobSize,
          height: knobSize,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          transition: "left 0.2s cubic-bezier(.4,1.2,.6,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {isLightMode ? (
          sunSvg ? (
            <CustomIcon svgString={sunSvg} size={knobIconSize} color={SunIconColor} />
          ) : (
            <SunIcon size={knobIconSize} color={SunIconColor} />
          )
        ) : moonSvg ? (
          <CustomIcon svgString={moonSvg} size={knobIconSize} color={MoonIconColor} />
        ) : (
          <MoonIcon size={knobIconSize} color={MoonIconColor} />
        )}
      </span>
    </button>
  );
}
