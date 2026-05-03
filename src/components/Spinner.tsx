import { type FC, type CSSProperties } from "react";

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = 24, color = "#60a5fa" }) => {
  const spinnerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  };

  const svgStyle: CSSProperties = {
    animation: "spin 1s linear infinite"
  };

  return (
    <div style={spinnerStyle}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={svgStyle}
      >
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          strokeDashoffset="10"
          opacity="0.25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          strokeDashoffset="10"
        />
      </svg>
    </div>
  );
};
