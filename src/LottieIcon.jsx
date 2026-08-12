// LottieIcon.jsx
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LottieIcon({ src, size, loop = true, autoplay = true, className = "" }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div className={`lottie-icon ${className}`} style={style}>
      <DotLottieReact src={src} loop={loop} autoplay={autoplay} />
    </div>
  );
}