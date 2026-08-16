import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { TravelSessionProvider } from "./contexts/TravelSessionContext";
import { GlobalTravelSheets } from "./components/sheets/GlobalTravelSheets";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminTools from "./pages/AdminTools";
import { Account, Explore, Notifications, PackageDetail, Support, Trips, Wishlist } from "./pages/PlatformPages";
import LiveTripPage from "./pages/LiveTripPage";
import ReviewPage from "./pages/ReviewPage";
import AdminPackageBuilderPage from "./pages/AdminPackageBuilderPage";
import AdminBroadcastPage from "./pages/AdminBroadcastPage";
import AdminBudgetPage from "./pages/AdminBudgetPage";
import AdminSystemPage from "./pages/AdminSystemPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminTravelerPage from "./pages/AdminTravelerPage";
import AdminOperationsPage from "./pages/AdminOperationsPage";
import { RoleGate } from "./components/security/RoleGate";
import NativeDashboardPage from "./pages/NativeDashboardPage";
import BookingAccessPage from "./pages/BookingAccessPage";
import BookingPortalPage from "./pages/BookingPortalPage";
import CheckoutPage from "./pages/CheckoutPage";
import InvoicePage from "./pages/InvoicePage";
import AdminManualBookingPage from "./pages/AdminManualBookingPage";
import AdminTripOperationsPage from "./pages/AdminTripOperationsPage";
import AdminGrowthPage from "./pages/AdminGrowthPage";
import AdminInvoicePage from "./pages/AdminInvoicePage";
import AdminEngagementPage from "./pages/AdminEngagementPage";
import TripDashboardPage from "./pages/TripDashboardPage";
import TripSharePage from "./pages/TripSharePage";
import AdminBookingOperationsPage from "./pages/AdminBookingOperationsPage";
import AdminProfileSettingsPage from "./pages/AdminProfileSettingsPage";
import DemoTripPage from "./pages/DemoTripPage";
import LoginPage from "./pages/LoginPage";
import "./styles/native-2026.css";
import "./styles/pkg-builder.css";

import AdminApp from "./admin/AdminApp";
import { BroadcastAlertBar } from "./components/common/BroadcastAlertBar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app" component={NativeDashboardPage} />
      <Route path="/access">{() => <BookingAccessPage />}</Route>
      <Route path="/access/:bookingCode">
        {({ bookingCode }: { bookingCode: string }) => <BookingPortalPage bookingCode={bookingCode} />}
      </Route>
      <Route path="/checkout">{() => <CheckoutPage />}</Route>
      <Route path="/invoice/:bookingCode">
        {({ bookingCode }: { bookingCode: string }) => <InvoicePage bookingCode={bookingCode} />}
      </Route>
      <Route path="/explore" component={Explore} />
      <Route path="/package/:id">
        {({ id }: { id: string }) => <PackageDetail id={id} />}
      </Route>
      <Route path="/booking">{() => <Redirect to="/checkout" />}</Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/register">{() => <Redirect to="/login" />}</Route>
      <Route path="/account" component={Account} />
      <Route path="/trips" component={Trips} />
      <Route path="/trips/live" component={LiveTripPage} />
      <Route path="/trip/:bookingCode">
        {({ bookingCode }: { bookingCode: string }) => <TripDashboardPage bookingCode={bookingCode} />}
      </Route>
      <Route path="/share/:token">
        {({ token }: { token: string }) => <TripSharePage token={token} />}
      </Route>
      <Route path="/demo/trip" component={DemoTripPage} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/review" component={ReviewPage} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/support" component={Support} />
      <Route path="/admin">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminApp /></RoleGate>}
      </Route>
      <Route path="/admin/settings">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminProfileSettingsPage /></RoleGate>}
      </Route>
      <Route path="/admin/tools">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminApp /></RoleGate>}
      </Route>
      <Route path="/admin/packages/new">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminPackageBuilderPage /></RoleGate>}
      </Route>
      <Route path="/admin/broadcasts">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminBroadcastPage /></RoleGate>}
      </Route>
      <Route path="/admin/budget">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminBudgetPage /></RoleGate>}
      </Route>
      <Route path="/admin/system">
        {() => <RoleGate allowed={["super_admin"]}><AdminSystemPage /></RoleGate>}
      </Route>
      <Route path="/admin/audit">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminAuditPage /></RoleGate>}
      </Route>
      <Route path="/admin/travelers/aarav-mehta">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminTravelerPage userId={1} /></RoleGate>}
      </Route>
      <Route path="/admin/travelers/:userId">
        {({ userId }: { userId: string }) => <RoleGate allowed={["admin", "super_admin"]}><AdminTravelerPage userId={Number(userId)} /></RoleGate>}
      </Route>
      <Route path="/admin/operations">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminOperationsPage /></RoleGate>}
      </Route>
      <Route path="/admin/bookings/:bookingCode">
        {({ bookingCode }: { bookingCode: string }) => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminBookingOperationsPage bookingCode={bookingCode} /></RoleGate>}
      </Route>
      <Route path="/admin/engagement">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminEngagementPage /></RoleGate>}
      </Route>
      <Route path="/admin/bookings/manual">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminManualBookingPage /></RoleGate>}
      </Route>
      <Route path="/admin/trips/live">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminTripOperationsPage /></RoleGate>}
      </Route>
      <Route path="/admin/growth">
        {() => <RoleGate allowed={["admin", "super_admin"]}><AdminGrowthPage /></RoleGate>}
      </Route>
      <Route path="/admin/invoices/:bookingCode">
        {() => <RoleGate allowed={["sub_admin", "admin", "super_admin"]}><AdminInvoicePage /></RoleGate>}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { ContactFloatingWidget } from "./components/common/ContactFloatingWidget";
import { MaintenanceGate } from "./components/common/MaintenanceGate";

export default function App() {
  return (
    <ErrorBoundary>
      <TravelSessionProvider>
        <TooltipProvider>
          <Toaster />
          <BroadcastAlertBar />
          <MaintenanceGate>
            <Router />
            <GlobalTravelSheets />
            <ContactFloatingWidget />
          </MaintenanceGate>
        </TooltipProvider>
      </TravelSessionProvider>
    </ErrorBoundary>
  );
}
