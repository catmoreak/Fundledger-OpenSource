import { useEffect, useState, type FC } from "react";

interface ToastProps {
  id: number;
  message: string;
  type?: "success" | "error";
  onRemove: (id: number) => void;
  duration?: number;
}

export const Toast: FC<ToastProps> = ({ id, message, type = "success", onRemove, duration = 3000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, duration, onRemove]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#1f2937",
        borderRadius: "8px",
        padding: "12px 16px",
        minWidth: "280px",
        maxWidth: "320px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
        border: "1px solid #374151"
      }}
    >
      
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {type === "error" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ef4444"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#22c55e"/>
            <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

   
      <p
        style={{
          margin: 0,
          color: "#f9fafb",
          fontSize: "14px",
          lineHeight: "1.4",
          flex: 1
        }}
      >
        {message}
      </p>

     
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          width: `${progress}%`,
          backgroundColor: type === "error" ? "#ef4444" : "#22c55e",
          transition: "width 0.05s ease-out",
          borderRadius: "0 0 8px 8px"
        }}
      />
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: number; message: string; type: string; duration: number }>;
  onRemove: (id: number) => void;
}

export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type as "success" | "error"}
          onRemove={onRemove}
          duration={toast.duration}
        />
      ))}
    </div>
  );
};
