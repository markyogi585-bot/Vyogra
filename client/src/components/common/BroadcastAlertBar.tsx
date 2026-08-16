import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, Flame, Info, Sparkles, Sun, X } from "lucide-react";
import { Link } from "wouter";
import { subscribeToActiveBroadcasts, type LiveBroadcast } from "@/lib/firebaseBroadcasts";

export function BroadcastAlertBar() {
  const [broadcasts, setBroadcasts] = useState<LiveBroadcast[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToActiveBroadcasts((list) => {
      setBroadcasts(list);
    });
    return () => unsub();
  }, []);

  const activeAlerts = broadcasts.filter((b) => b.id && !dismissedIds.includes(b.id));
  if (activeAlerts.length === 0) return null;

  const current = activeAlerts[0];

  const dismiss = () => {
    if (current.id) {
      setDismissedIds((prev) => [...prev, current.id!]);
    }
  };

  const getIcon = (type: LiveBroadcast["type"]) => {
    switch (type) {
      case "urgent_alert":
      case "weather_warning":
        return <AlertTriangle size={15} className="alert-icon-urgent" />;
      case "flash_offer":
        return <Flame size={15} className="alert-icon-flash" />;
      default:
        return <Bell size={15} className="alert-icon-info" />;
    }
  };

  return (
    <div className={`broadcast-bar ${current.type}`}>
      <div className="broadcast-content">
        <div className="broadcast-pill">
          {getIcon(current.type)}
          <span>{current.type.replaceAll("_", " ").toUpperCase()}</span>
        </div>

        <div className="broadcast-text">
          <b>{current.title}</b>
          <span>{current.message}</span>
        </div>

        {current.actionText && current.actionLink && (
          <Link href={current.actionLink} className="broadcast-link">
            <span>{current.actionText}</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <button className="broadcast-dismiss" onClick={dismiss} title="Dismiss notification">
        <X size={15} />
      </button>

      <style>{`
        .broadcast-bar {
          width: 100%;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: white;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .broadcast-bar.urgent_alert, .broadcast-bar.weather_warning {
          background: #dc2626;
        }
        .broadcast-bar.flash_offer {
          background: #d97706;
        }
        .broadcast-bar.route_update, .broadcast-bar.general_notice {
          background: #0f766e;
        }
        .broadcast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          flex: 1;
        }
        .broadcast-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 12px;
          background: rgba(255,255,255,0.22);
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .broadcast-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .broadcast-text b {
          font-weight: 700;
        }
        .broadcast-text span {
          opacity: 0.95;
        }
        .broadcast-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-weight: 700;
          text-decoration: underline;
          margin-left: 8px;
        }
        .broadcast-dismiss {
          background: none;
          border: none;
          color: white;
          opacity: 0.8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .broadcast-dismiss:hover { opacity: 1; }
        @media (max-width: 768px) {
          .broadcast-bar { padding: 8px 14px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
