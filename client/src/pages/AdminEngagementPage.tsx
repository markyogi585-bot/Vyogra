import { useState } from "react";
import { BellRing, CheckCircle2, ExternalLink, Headphones, LoaderCircle, MessageSquareText, PackagePlus, Phone, Send, Sparkles, UserRoundPlus, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { trpc } from "@/lib/trpcClient";

type Channel = "whatsapp" | "email" | "phone";
type ChildType = "child" | "infant";

export default function AdminEngagementPage() {
  const utils = trpc.useUtils();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [replyVisible, setReplyVisible] = useState(true);
  const [announcement, setAnnouncement] = useState({ title: "", body: "", isActive: true });
  const [child, setChild] = useState({ bookingId: "", fullName: "", travelerCategory: "child" as ChildType, dateOfBirth: "", guardianName: "", guardianPhone: "", dietaryNotes: "", guardianConsent: false });
  const [channel, setChannel] = useState({ channel: "whatsapp" as Channel, label: "WhatsApp trip support", destination: "", isActive: true });

  const queue = trpc.admin.engagement.supportQueue.useQuery();
  const announcements = trpc.admin.engagement.listAnnouncements.useQuery();
  const broadcasts = trpc.admin.engagement.broadcasts.useQuery();
  const channels = trpc.admin.engagement.supportChannels.useQuery();
  const thread = trpc.admin.engagement.supportThread.useQuery({ ticketId: selectedTicketId ?? 1 }, { enabled: Boolean(selectedTicketId) });
  const childTravelers = trpc.admin.engagement.childTravelers.useQuery({ bookingId: Number(child.bookingId) || 1 }, { enabled: Number(child.bookingId) > 0 });

  const saveAnnouncement = trpc.admin.engagement.saveAnnouncement.useMutation({ onSuccess: () => { toast.success("Announcement saved."); setAnnouncement({ title: "", body: "", isActive: true }); void announcements.refetch(); } });
  const publishBroadcast = trpc.admin.engagement.publishInAppBroadcast.useMutation({ onSuccess: () => { toast.success("In-app broadcast published."); void broadcasts.refetch(); } });
  const addChild = trpc.admin.engagement.addChildTraveler.useMutation({ onSuccess: () => { toast.success("Child traveler added to this booking."); setChild({ bookingId: child.bookingId, fullName: "", travelerCategory: "child", dateOfBirth: "", guardianName: "", guardianPhone: "", dietaryNotes: "", guardianConsent: false }); void childTravelers.refetch(); } });
  const saveChannel = trpc.admin.engagement.saveSupportChannel.useMutation({ onSuccess: () => { toast.success("Contact channel saved."); void channels.refetch(); } });
  const replyToTicket = trpc.admin.engagement.replyToSupport.useMutation({ onSuccess: () => { toast.success(replyVisible ? "Traveler reply sent." : "Internal note added."); setReply(""); void thread.refetch(); void queue.refetch(); } });
  const setTicketStatus = trpc.admin.engagement.setSupportStatus.useMutation({ onSuccess: () => { toast.success("Ticket status updated."); void queue.refetch(); void thread.refetch(); } });

  const selectedTicket = queue.data?.find((ticket) => ticket.id === selectedTicketId);
  const busy = saveAnnouncement.isPending || addChild.isPending || saveChannel.isPending || replyToTicket.isPending;

  return <AdminPageFrame eyebrow="ENGAGEMENT / TRAVELER CARE" title={<>Every message has<br /><i>a place to land.</i></>}>
    <section className="engagement-command-strip">
      <Link href="/admin/packages/new"><PackagePlus size={18} /><span><b>Create a package</b><small>Build dates, pricing, terms, media, and day plans.</small></span><ExternalLink size={15} /></Link>
      <Link href="/admin/bookings/manual"><UsersRound size={18} /><span><b>Issue a manual booking</b><small>Generate booking ID, terms acceptance, and invoice.</small></span><ExternalLink size={15} /></Link>
      <Link href="/admin/broadcasts"><BellRing size={18} /><span><b>Compose audience broadcast</b><small>Create a segment-aware notification draft.</small></span><ExternalLink size={15} /></Link>
    </section>

    <div className="engagement-grid">
      <section className="engagement-card engagement-card-wide">
        <div className="engagement-heading"><div><span className="admin-overline">MANUAL SUPPORT / LIVE QUEUE</span><h2>Traveler care desk</h2><p>Reply, assign, resolve, or leave an internal note. Every update is server-authorized and recorded.</p></div><Headphones size={22} /></div>
        {queue.isLoading ? <div className="engagement-loading"><LoaderCircle size={18} /> Loading support requests…</div> : queue.error ? <p className="engagement-error">Unable to load the support queue. Refresh and try again.</p> : queue.data?.length ? <div className="engagement-ticket-list">{queue.data.map((ticket) => <button className={ticket.id === selectedTicketId ? "engagement-ticket active" : "engagement-ticket"} key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}><span><b>{ticket.ticketCode}</b><small>{ticket.subject}</small></span><em>{ticket.status.replace("_", " ")}</em></button>)}</div> : <p className="engagement-empty">No support requests are waiting. New traveler requests will appear here.</p>}
        {selectedTicket && <div className="engagement-thread"><div className="engagement-thread-head"><span><b>{selectedTicket.ticketCode}</b><small>{selectedTicket.subject}</small></span><select value={selectedTicket.status} onChange={(event) => setTicketStatus.mutate({ ticketId: selectedTicket.id, status: event.target.value as "open" | "in_progress" | "resolved" | "closed" })}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><p className="engagement-ticket-body">{selectedTicket.body}</p>{thread.isLoading ? <p>Loading conversation…</p> : <div className="engagement-replies">{thread.data?.length ? thread.data.map((item) => <article key={item.id} className={item.visibleToTraveler ? "visible-reply" : "internal-reply"}><span>{item.visibleToTraveler ? "Traveler-visible reply" : "Internal note"}</span><p>{item.body}</p></article>) : <p className="engagement-empty">No replies yet. Add the first clear next step.</p>}</div>}<textarea value={reply} onChange={(event) => setReply(event.target.value.slice(0, 3000))} placeholder="Write a clear support response or internal handover…" /><label className="engagement-check"><input type="checkbox" checked={replyVisible} onChange={(event) => setReplyVisible(event.target.checked)} /> Visible to traveler</label><button className="sheet-primary-action" disabled={!reply.trim() || replyToTicket.isPending} onClick={() => replyToTicket.mutate({ ticketId: selectedTicket.id, body: reply, visibleToTraveler: replyVisible, status: "in_progress" })}>{replyToTicket.isPending ? "Saving…" : replyVisible ? "Send traveler reply" : "Add internal note"}<Send size={16} /></button></div>}
      </section>

      <section className="engagement-card">
        <div className="engagement-heading"><div><span className="admin-overline">ANNOUNCEMENTS / IN-APP</span><h2>Publish with intent</h2></div><Sparkles size={21} /></div>
        <input value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value.slice(0, 180) })} placeholder="Announcement title" />
        <textarea value={announcement.body} onChange={(event) => setAnnouncement({ ...announcement, body: event.target.value.slice(0, 2000) })} placeholder="What should travelers know?" />
        <label className="engagement-check"><input type="checkbox" checked={announcement.isActive} onChange={(event) => setAnnouncement({ ...announcement, isActive: event.target.checked })} /> Publish immediately</label>
        <button className="sheet-primary-action" disabled={announcement.title.trim().length < 3 || announcement.body.trim().length < 5 || saveAnnouncement.isPending} onClick={() => saveAnnouncement.mutate(announcement)}>Save announcement <Send size={16} /></button>
        <div className="engagement-mini-list">{announcements.data?.slice(0, 4).map((item) => <article key={item.id}><b>{item.title}</b><small>{item.isActive ? "Active" : "Draft"}</small></article>)}{announcements.isLoading && <p>Loading announcements…</p>}{!announcements.isLoading && !announcements.data?.length && <p className="engagement-empty">No announcements published yet.</p>}</div>
      </section>

      <section className="engagement-card">
        <div className="engagement-heading"><div><span className="admin-overline">CHILD TRAVELERS / CONSENT</span><h2>Travel party care</h2></div><UserRoundPlus size={21} /></div>
        <input inputMode="numeric" value={child.bookingId} onChange={(event) => setChild({ ...child, bookingId: event.target.value.replace(/\D/g, "") })} placeholder="Booking ID (numeric)" />
        <input value={child.fullName} onChange={(event) => setChild({ ...child, fullName: event.target.value.slice(0, 160) })} placeholder="Child or infant full name" />
        <div className="engagement-split"><select value={child.travelerCategory} onChange={(event) => setChild({ ...child, travelerCategory: event.target.value as ChildType })}><option value="child">Child</option><option value="infant">Infant</option></select><input type="date" value={child.dateOfBirth} onChange={(event) => setChild({ ...child, dateOfBirth: event.target.value })} /></div>
        <input value={child.guardianName} onChange={(event) => setChild({ ...child, guardianName: event.target.value.slice(0, 160) })} placeholder="Guardian full name" />
        <input value={child.guardianPhone} onChange={(event) => setChild({ ...child, guardianPhone: event.target.value.slice(0, 32) })} placeholder="Guardian phone" />
        <textarea value={child.dietaryNotes} onChange={(event) => setChild({ ...child, dietaryNotes: event.target.value.slice(0, 1500) })} placeholder="Dietary or care notes (optional)" />
        <label className="engagement-check"><input type="checkbox" checked={child.guardianConsent} onChange={(event) => setChild({ ...child, guardianConsent: event.target.checked })} /> Guardian consent is recorded</label>
        <button className="sheet-primary-action" disabled={!child.bookingId || !child.fullName || !child.dateOfBirth || !child.guardianName || !child.guardianPhone || !child.guardianConsent || addChild.isPending} onClick={() => addChild.mutate({ ...child, bookingId: Number(child.bookingId), dateOfBirth: new Date(`${child.dateOfBirth}T00:00:00`), guardianConsent: true })}>Add protected traveler <CheckCircle2 size={16} /></button>
        {childTravelers.data?.filter((person) => person.travelerCategory !== "adult").map((person) => <p className="engagement-chip" key={person.id}>{person.fullName} · {person.travelerCategory}</p>)}
      </section>

      <section className="engagement-card">
        <div className="engagement-heading"><div><span className="admin-overline">CONTACT CHANNELS / HANDOFF</span><h2>Support that reaches a person</h2></div><Phone size={21} /></div>
        <div className="engagement-split"><select value={channel.channel} onChange={(event) => setChannel({ ...channel, channel: event.target.value as Channel })}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="phone">Phone</option></select><input value={channel.label} onChange={(event) => setChannel({ ...channel, label: event.target.value.slice(0, 80) })} placeholder="Public label" /></div>
        <input value={channel.destination} onChange={(event) => setChannel({ ...channel, destination: event.target.value.slice(0, 255) })} placeholder={channel.channel === "email" ? "support@company.in" : "+919876543210"} />
        <label className="engagement-check"><input type="checkbox" checked={channel.isActive} onChange={(event) => setChannel({ ...channel, isActive: event.target.checked })} /> Show to travelers</label>
        <button className="sheet-primary-action" disabled={!channel.label.trim() || !channel.destination.trim() || saveChannel.isPending} onClick={() => saveChannel.mutate(channel)}>Save contact channel <Phone size={16} /></button>
        <div className="engagement-mini-list">{channels.data?.map((item) => <article key={item.id}><b>{item.label}</b><small>{item.isActive ? "Visible" : "Hidden"}</small></article>)}{channels.isLoading && <p>Loading contacts…</p>}{!channels.isLoading && !channels.data?.length && <p className="engagement-empty">Add the real WhatsApp, email, or phone number your team monitors.</p>}</div>
      </section>

      <section className="engagement-card engagement-card-wide">
        <div className="engagement-heading"><div><span className="admin-overline">NOTIFICATION DELIVERY / IN-APP</span><h2>Broadcast delivery desk</h2><p>Publishing here makes the prepared message available inside the traveler experience. External push delivery remains intentionally separate from in-app status.</p></div><BellRing size={22} /></div>
        {broadcasts.isLoading ? <p>Loading prepared broadcasts…</p> : broadcasts.error ? <p className="engagement-error">Broadcast status could not be loaded.</p> : broadcasts.data?.length ? <div className="engagement-broadcast-list">{broadcasts.data.map((item) => <article key={item.id}><span><b>{item.title}</b><small>{item.audience} · {item.status}</small></span>{item.status === "sent" ? <em>In-app published</em> : <button onClick={() => publishBroadcast.mutate({ broadcastId: item.id })} disabled={publishBroadcast.isPending}><BellRing size={15} /> Publish in app</button>}</article>)}</div> : <div className="engagement-empty"><p>No broadcast drafts exist yet.</p><Link href="/admin/broadcasts">Create a broadcast</Link></div>}
      </section>
    </div>
    {busy && <p className="engagement-saving"><LoaderCircle size={15} /> Saving connected operational data…</p>}
  </AdminPageFrame>;
}
