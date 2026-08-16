import { AnimatePresence } from "framer-motion";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { AuthSheet } from "./AuthSheet";
import { DateTravelSheet } from "./DateTravelSheet";
import { SearchSheet } from "./SearchSheet";

export function GlobalTravelSheets() { const { authOpen, searchOpen, dateSheetOpen } = useTravelSession(); return <AnimatePresence>{authOpen && <AuthSheet />}{searchOpen && <SearchSheet />}{dateSheetOpen && <DateTravelSheet />}</AnimatePresence>; }
