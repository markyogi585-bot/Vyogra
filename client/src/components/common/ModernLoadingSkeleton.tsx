import React from "react";

export function PackageCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, width: "100%" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            position: "relative",
          }}
        >
          {/* Shimmer Image Box */}
          <div
            className="shimmer-2026"
            style={{
              width: "100%",
              aspectRatio: "16/10",
              background: "linear-gradient(90deg, #f0ede6 0%, #faf8f5 50%, #f0ede6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmerWave 1.6s infinite ease-in-out",
            }}
          />
          {/* Shimmer Content */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  width: "35%",
                  height: 14,
                  borderRadius: 6,
                  background: "#eee8de",
                }}
              />
              <div
                style={{
                  width: "25%",
                  height: 14,
                  borderRadius: 6,
                  background: "#eee8de",
                }}
              />
            </div>
            <div
              style={{
                width: "80%",
                height: 24,
                borderRadius: 8,
                background: "#e4ded4",
              }}
            />
            <div
              style={{
                width: "60%",
                height: 14,
                borderRadius: 6,
                background: "#f0ede6",
              }}
            />
            <div
              style={{
                marginTop: 10,
                paddingTop: 14,
                borderTop: "1px solid #f0ede6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "40%",
                  height: 20,
                  borderRadius: 6,
                  background: "#f3e1d6",
                }}
              />
              <div
                style={{
                  width: "30%",
                  height: 32,
                  borderRadius: 10,
                  background: "#f06a3a",
                  opacity: 0.25,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.06)",
            gap: 16,
            animation: `pulseGlow 2s infinite ease-in-out ${i * 0.15}s`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "20%" }}>
            <div style={{ width: "80%", height: 16, borderRadius: 4, background: "#f06a3a", opacity: 0.3 }} />
            <div style={{ width: "50%", height: 10, borderRadius: 4, background: "#eee" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "35%" }}>
            <div style={{ width: "70%", height: 16, borderRadius: 4, background: "#ddd" }} />
            <div style={{ width: "40%", height: 10, borderRadius: 4, background: "#eee" }} />
          </div>
          <div style={{ width: "15%", height: 18, borderRadius: 6, background: "#eee" }} />
          <div style={{ width: "20%", height: 32, borderRadius: 8, background: "#e8f0ec" }} />
        </div>
      ))}
    </div>
  );
}

export function PulseBadge({ status }: { status: "pending_approval" | "approved" | "completed" | "cancelled" | string }) {
  if (status === "pending_approval" || status === "pending_manual_review") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          background: "#fef3c7",
          color: "#92400e",
          fontSize: 11,
          fontWeight: 800,
          border: "1px solid #fde68a",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#d97706",
            boxShadow: "0 0 8px #d97706",
            animation: "badgePulse 1.4s infinite ease-in-out",
          }}
        />
        ⚠️ Manual Review Pending
      </span>
    );
  }

  if (status === "confirmed" || status === "approved") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          background: "#dcfce7",
          color: "#166534",
          fontSize: 11,
          fontWeight: 800,
          border: "1px solid #bbf7d0",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#16a34a",
            boxShadow: "0 0 8px #16a34a",
          }}
        />
        🟢 Confirmed & Verified
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          background: "#f0fdf4",
          color: "#166534",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        🚩 Yatra Completed
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 20,
        background: "#f4f0e8",
        color: "#666",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}
