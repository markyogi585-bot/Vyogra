import { Camera, Clock3, MapPin, Megaphone, Route, ShieldCheck } from "lucide-react";

const updates = [
  { type: "location", icon: MapPin, time: "10:40", title: "Arrived at Palolem beach", body: "Your group has reached today’s coastal stop. Free time is open until 13:00.", tone: "teal" },
  { type: "host", icon: Megaphone, time: "09:15", title: "A note from Ananya", body: "Carry a light layer for tonight—the sea breeze comes in quickly after sunset.", tone: "violet" },
  { type: "route", icon: Route, time: "08:30", title: "Route check complete", body: "The Cavelossim transfer is on time. Meet at the hotel lobby at 14:15.", tone: "blue" },
];
export function TripUpdateFeed() { return <section className="trip-update-feed"><div className="trip-update-heading"><div><span>LIVE TRIP UPDATES</span><h2>On the ground,<br /><i>with you.</i></h2></div><button><Clock3 size={15} /> Today</button></div>{updates.map(({ icon: Icon, time, title, body, tone }) => <article className={`trip-update ${tone}`} key={title}><span className="trip-update-icon"><Icon size={17} /></span><div><small>{time} · TRIP DESK</small><b>{title}</b><p>{body}</p></div></article>)}<div className="trip-update-safety"><ShieldCheck size={17} /><span>Location milestones are shared by your host. Precise traveler location is never published to the group.</span></div></section>; }
