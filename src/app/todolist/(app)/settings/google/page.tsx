import { PlatformOnboardingPage } from "@/features/settings/PlatformOnboardingPage";

export default function GoogleOnboardingPage() {
  return (
    <PlatformOnboardingPage
      config={{
        platform: "google",
        platformName: "구글",
        platformColor: "#4285F4",
        platformLogo: "G",
      }}
    />
  );
}
