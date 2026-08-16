import { Link } from "wouter";
import { nativeServices, nativeUtilityServices } from "@/lib/nativeData";

export function TravelServiceGrid() { return <><section className="native-primary-services">{nativeServices.map(({ label, icon: Icon, tone, href }) => <Link href={href} className={`native-primary-service ${tone}`} key={label}><span className="native-service-illustration"><Icon strokeWidth={1.7} /></span><b>{label}</b><small>Explore</small></Link>)}</section><section className="native-utility-card">{nativeUtilityServices.map(({ label, icon: Icon }) => <Link href="/explore" className="native-utility-service" key={label}><span><Icon strokeWidth={1.7} /></span><b>{label}</b></Link>)}<i className="native-utility-notch" /></section></>; }
