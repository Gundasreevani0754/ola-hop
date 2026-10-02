import { ImageResponse } from "next/og";

export const alt = "Ola Hop: shared autos, cabs and buses that run like a metro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#eceeed",
          color: "#121a16",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
          Ola<span style={{ color: "#0f7a55", marginLeft: 12 }}>Hop</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Shared autos, cabs and buses that run like a metro.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
            {[
              ["#d4561c", "Bus ₹25"],
              ["#d39b00", "Auto ₹50"],
              ["#2f6fec", "Cab ₹80"],
            ].map(([color, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: "14px 24px",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 8, background: color }} />
                {label}
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#0f7a55",
                color: "#ffffff",
                borderRadius: 20,
                padding: "14px 24px",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              Every 4 min
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#66736c" }}>
          Concept prototype for an APM assessment · not an official Ola product · simulated data
        </div>
      </div>
    ),
    size,
  );
}
