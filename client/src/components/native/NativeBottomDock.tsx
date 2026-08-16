import { Heart, Home, Search, Ticket, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTravelSession } from "@/contexts/TravelSessionContext";

export function NativeBottomDock({ onProfile }: { onProfile: () => void }) { const [location] = useLocation(); const { openSearch } = useTravelSession(); return <nav className="native-bottom-dock"><Link href="/app" className={location === "/app" ? "active" : ""}><Home size={19} /><span>Home</span></Link><Link href="/trips" className={location.startsWith("/trips") ? "active" : ""}><Ticket size={19} /><span>Trips</span></Link><button className="native-search-orb" onClick={openSearch} aria-label="Search packages"><Search size={23} /></button><Link href="/wishlist" className={location === "/wishlist" ? "active" : ""}><Heart size={19} /><span>Saved</span></Link><button onClick={onProfile}><UserRound size={19} /><span>Profile</span></button></nav>; }
