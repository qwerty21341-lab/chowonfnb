import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1a1612",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
        }}
      >
        <span
          style={{
            color: "#c9a84c",
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          단
        </span>
      </div>
    ),
    { ...size }
  );
}
