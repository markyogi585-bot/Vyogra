export type AccountRole = "guest" | "user" | "sub_admin" | "admin" | "super_admin";
export type AuthIntent = "booking" | "wishlist" | "wallet" | "review" | "account";
export type TripState = "upcoming" | "active" | "completed" | "cancelled";

export type SessionProfile = {
  uid?: string;
  name: string;
  phone: string;
  email: string;
  role: AccountRole;
  loginMethod: "otp" | "google" | "email" | "apple";
  emailVerified?: boolean;
  photoURL?: string;
  city?: string;
  emergencyPhone?: string;
  profileComplete?: boolean;
};

export const roleLabels: Record<AccountRole, string> = {
  guest: "Guest",
  user: "Traveler",
  sub_admin: "Sub-Admin",
  admin: "Admin",
  super_admin: "Super Admin",
};
