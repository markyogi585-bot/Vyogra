import { BarChart3 } from "lucide-react";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { BudgetPlanner } from "@/components/admin/BudgetPlanner";
export default function AdminBudgetPage() { return <AdminPageFrame eyebrow="COMMERCIAL / BUDGET" title={<>Know the cost.<br /><i>Protect the route.</i></>}><div className="admin-budget-layout"><BudgetPlanner /><aside className="budget-kpi-stack"><article><span>Monthly package revenue</span><b>₹12,84,200</b><small>+14.6% vs last month</small></article><article><span>Outstanding payments</span><b>₹2,18,600</b><small>18 travelers to follow up</small></article><article><BarChart3 size={19} /><span>Cancellation trend</span><b>3.2%</b><small>Within threshold</small></article></aside></div></AdminPageFrame>; }
