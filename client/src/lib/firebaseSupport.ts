/**
 * Firebase Support Tickets & Live Chat Service
 * Collections: `supportTickets`, `supportTickets/{id}/messages`
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory =
  | "booking_help"
  | "payment_refund"
  | "route_customization"
  | "live_trip_issue"
  | "general_inquiry";

export interface SupportTicket {
  id?: string;
  ticketCode: string; // e.g. TKT-2026-4821
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingCode?: string;
  category: TicketCategory;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  lastReplyBy?: "user" | "admin";
  lastMessageSnippet?: string;
  adminNotes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TicketMessage {
  id?: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin" | "host";
  text: string;
  attachments?: string[];
  createdAt?: unknown;
}

const COLLECTION = "supportTickets";

function generateTicketCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TKT-2026-${num}`;
}

/** Create a new support ticket */
export async function createSupportTicket(
  data: Omit<SupportTicket, "id" | "ticketCode" | "status" | "priority" | "createdAt" | "updatedAt"> & {
    priority?: TicketPriority;
  },
): Promise<{ id: string; ticketCode: string }> {
  if (!firebaseDb) throw new Error("Firestore not configured");
  const ticketCode = generateTicketCode();
  const col = collection(firebaseDb, COLLECTION);
  const docRef = await addDoc(col, {
    ...data,
    ticketCode,
    status: "open" as TicketStatus,
    priority: data.priority ?? "medium",
    lastReplyBy: "user",
    lastMessageSnippet: data.body.slice(0, 100),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Also add initial message to subcollection
  const msgCol = collection(firebaseDb, COLLECTION, docRef.id, "messages");
  await addDoc(msgCol, {
    ticketId: docRef.id,
    senderId: data.userId,
    senderName: data.userName,
    senderRole: "user",
    text: data.body,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, ticketCode };
}

/** Send message in ticket thread */
export async function sendTicketMessage(
  ticketId: string,
  message: {
    senderId: string;
    senderName: string;
    senderRole: "user" | "admin" | "host";
    text: string;
  },
): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore not configured");
  const msgCol = collection(firebaseDb, COLLECTION, ticketId, "messages");
  const msgRef = await addDoc(msgCol, {
    ...message,
    ticketId,
    createdAt: serverTimestamp(),
  });

  // Update ticket last message & status
  const ticketRef = doc(firebaseDb, COLLECTION, ticketId);
  await updateDoc(ticketRef, {
    lastReplyBy: message.senderRole,
    lastMessageSnippet: message.text.slice(0, 100),
    status: message.senderRole === "admin" ? "in_progress" : "waiting_on_user",
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

/** Real-time subscription to user's tickets */
export function subscribeToUserTickets(
  userId: string,
  callback: (tickets: SupportTicket[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(firebaseDb, COLLECTION),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    );
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      callback(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as SupportTicket));
    }, () => {
      if (!firebaseDb) return;
      const q2 = query(collection(firebaseDb, COLLECTION), where("userId", "==", userId));
      onSnapshot(q2, (snap2: QuerySnapshot<DocumentData>) => {
        callback(snap2.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as SupportTicket));
      });
    });
  } catch {
    callback([]);
    return () => {};
  }
}

/** Real-time subscription to all tickets (Admin) */
export function subscribeToAllTickets(
  callback: (tickets: SupportTicket[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      callback(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as SupportTicket));
    }, () => {
      if (!firebaseDb) return;
      onSnapshot(collection(firebaseDb, COLLECTION), (snap2: QuerySnapshot<DocumentData>) => {
        callback(snap2.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as SupportTicket));
      });
    });
  } catch {
    callback([]);
    return () => {};
  }
}

/** Real-time messages listener for a ticket thread */
export function subscribeToTicketMessages(
  ticketId: string,
  callback: (messages: TicketMessage[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback([]);
    return () => {};
  }
  try {
    const msgCol = collection(firebaseDb, COLLECTION, ticketId, "messages");
    const q = query(msgCol, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      callback(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as TicketMessage));
    });
  } catch {
    callback([]);
    return () => {};
  }
}

/** Update ticket status */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminNotes?: string,
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, ticketId);
  const updates: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  await updateDoc(ref, updates);
}

/** Label helpers */
export function ticketStatusLabel(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open: "New Request",
    in_progress: "In Progress",
    waiting_on_user: "Waiting on You",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] ?? status;
}

export function ticketCategoryLabel(category: TicketCategory): string {
  const map: Record<TicketCategory, string> = {
    booking_help: "Booking Assistance",
    payment_refund: "Payment & Invoices",
    route_customization: "Custom Itinerary",
    live_trip_issue: "Live Trip Support",
    general_inquiry: "General Question",
  };
  return map[category] ?? category;
}
