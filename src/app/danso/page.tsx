// Legacy route — proxy.ts redirects /danso → /ko/danso at the edge.
// This page serves as a fallback for environments where the proxy isn't running.
import { redirect } from "next/navigation";

export default function DansoLegacyRedirect() {
  redirect("/ko/danso");
}
