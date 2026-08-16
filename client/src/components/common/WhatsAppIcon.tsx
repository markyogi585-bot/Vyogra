import React from "react";

export function WhatsAppIcon({
  size = 20,
  className,
  style,
  color,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/3840px-WhatsApp.svg.png"
      alt="WhatsApp"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
      loading="eager"
    />
  );
}
