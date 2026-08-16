import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export type ExploreAction = { label: string; note: string; icon: LucideIcon; href?: string; onActivate?: () => void; accent?: "sand" | "sage" | "clay" | "mist" };

export function ExploreActionGrid({ actions }: { actions: ExploreAction[] }) {
  return <div className="explore-action-grid">{actions.map(({ label, note, icon: Icon, href, onActivate, accent = "sand" }) => href ? <Link href={href} className={`explore-action-card action-${accent}`} key={label}><span className="explore-action-icon"><Icon size={20} /></span><div><b>{label}</b><small>{note}</small></div><ArrowRight size={16} /></Link> : <button className={`explore-action-card action-${accent}`} key={label} onClick={onActivate}><span className="explore-action-icon"><Icon size={20} /></span><div><b>{label}</b><small>{note}</small></div><ArrowRight size={16} /></button>)}</div>;
}
