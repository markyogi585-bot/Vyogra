import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { connectedTravelerRoutes } from "./navigationContract";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");

describe("gift-card removal and responsive content cleanup", () => {
  it("removes every gift-card and wallet surface without leaving a retired traveler page", () => {
    const profileDrawer = read("client/src/components/native/NativeProfileDrawer.tsx");
    const app = read("client/src/App.tsx");

    expect(profileDrawer).not.toMatch(/gift.?cards/i);
    expect(profileDrawer).not.toMatch(/wallet/i);
    expect(app).not.toContain("WalletPage");
    expect(app).not.toContain('path={"/wallet"}');
  });

  it("preserves populated package, booking, login, and traveler navigation routes", () => {
    const home = read("client/src/pages/Home.tsx");
    const app = read("client/src/App.tsx");
    const shell = read("client/src/components/VoyagrShell.tsx");
    const styles = read("client/src/styles/native-2026.css");

    ["/explore", "/access", "/trips", "/account", "/checkout"].forEach((route) => {
      expect(connectedTravelerRoutes).toContain(route);
    });
    expect(home).toContain('href="/explore"');
    expect(home).toContain('href="/access"');
    expect(app).toContain('path={"/checkout"}');
    expect(app).toContain('<GlobalTravelSheets />');
    expect(shell).toContain('aria-label="Primary mobile navigation"');
    ["copy.home", "copy.explore", "copy.trips", "copy.saved", "copy.profile"].forEach((label) => {
      expect(shell).toContain(label);
    });
    expect(styles).toContain('grid-template-columns:repeat(5,minmax(0,1fr))');
  });

  it("optimizes React and tRPC through one Vite dependency graph for responsive previews", () => {
    const viteConfig = read("vite.config.ts");
    const legacyThemeBoundary = read("client/src/contexts/ThemeContext.tsx");
    const appShell = read("client/index.html");
    const worker = read("client/public/sw.js");

    ["\"react\"", "\"react-dom\"", "\"react/jsx-runtime\"", "\"@trpc/react-query\""]
      .forEach((dependency) => expect(viteConfig).toContain(dependency));
    expect(legacyThemeBoundary).toContain("return <>{children}</>;");
    expect(legacyThemeBoundary).not.toContain("useState(");
    expect(legacyThemeBoundary).not.toContain("useContext(");
    expect(appShell).toContain('"127.0.0.1"');
    expect(appShell).toContain('key.startsWith("voyagr-shell-")');
    expect(worker).toContain('requestUrl.pathname.startsWith("/src/")');
    expect(worker).toContain('requestUrl.port === "3000"');
  });
});
