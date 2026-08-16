import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import { SheetFrame } from "./SheetFrame";
import { useTravelSession } from "@/contexts/TravelSessionContext";

const categories = ["Mountains", "Beaches", "Heritage", "Nature", "Wellness", "Culture"];
const durations = ["1–3 days", "4–7 days", "8–14 days", "15+ days"];
const groups = ["Solo", "Couple", "3–5", "6+"];
const ratings = ["Any rating", "4.5+", "4.0+", "New route"];

export function SearchSheet() {
  const { closeSearch, searchQuery, setSearchQuery } = useTravelSession();
  const [step, setStep] = useState<"search" | "filters">("search");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [price, setPrice] = useState(50000);
  const [group, setGroup] = useState("Couple");
  const [rating, setRating] = useState("Any rating");
  const toggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const go = () => { const params = new URLSearchParams({ q: searchQuery, maxPrice: String(price), page: "1" }); if (selectedCategories.length) params.set("categories", selectedCategories.join(",")); if (selectedDurations.length) params.set("durations", selectedDurations.join(",")); params.set("group", group); params.set("rating", rating); closeSearch(); window.location.assign(`/explore?${params.toString()}`); };
  return <SheetFrame eyebrow={step === "search" ? "DISCOVER A ROUTE" : "FIND YOUR FIT"} title={step === "search" ? "Where will you go?" : "Dial it in."} onClose={closeSearch} wide>
    {step === "search" ? <div className="search-sheet-content"><div className="smart-search-input"><Search size={19} /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Destination, package, mood, or tag" /><button onClick={go}>Search <ArrowRight size={16} /></button></div><div className="search-quick-grid"><button onClick={() => setSearchQuery("mountains")}><span>01</span>Mountain mornings</button><button onClick={() => setSearchQuery("beaches")}><span>02</span>Salt air & beaches</button><button onClick={() => setSearchQuery("heritage")}><span>03</span>Slow heritage</button><button onClick={() => setSearchQuery("wellness")}><span>04</span>Wellness pauses</button></div><button className="filters-entry" onClick={() => setStep("filters")}><SlidersHorizontal size={17} /><span>Open all filters</span><ArrowRight size={16} /></button></div> : <div className="filter-sheet-content">
      <div className="filter-block"><label>Travel categories <b>{selectedCategories.length || "Any"}</b></label><div className="sheet-chip-row">{categories.map((item) => <button key={item} className={selectedCategories.includes(item) ? "active" : ""} onClick={() => toggle(item, setSelectedCategories)}>{selectedCategories.includes(item) && <Check size={13} />}{item}</button>)}</div></div>
      <div className="filter-block"><label>Route duration</label><div className="sheet-chip-row">{durations.map((item) => <button key={item} className={selectedDurations.includes(item) ? "active" : ""} onClick={() => toggle(item, setSelectedDurations)}>{selectedDurations.includes(item) && <Check size={13} />}{item}</button>)}</div></div>
      <div className="filter-block"><label>Budget per person <b>Up to ₹{new Intl.NumberFormat("en-IN").format(price)}</b></label><input className="range-input" type="range" min="5000" max="100000" step="5000" value={price} onChange={(event) => setPrice(Number(event.target.value))} /></div>
      <div className="filter-block"><label>Travel party</label><div className="sheet-chip-row">{groups.map((item) => <button key={item} className={group === item ? "active" : ""} onClick={() => setGroup(item)}><Users size={13} />{item}</button>)}</div></div>
      <div className="filter-block"><label>Route note filter</label><div className="sheet-chip-row">{ratings.map((item) => <button key={item} className={rating === item ? "active" : ""} onClick={() => setRating(item)}><Star size={13} />{item}</button>)}</div></div>
      <div className="filter-two-up"><button><CalendarDays size={17} /><span>Departure</span><b>Any month</b></button><button onClick={() => setStep("search")}><Search size={17} /><span>Result pages</span><b>Page 1 of 3</b></button></div><button className="sheet-primary-action" onClick={go}>Show matching routes <ArrowRight size={17} /></button>
    </div>}
  </SheetFrame>;
}
