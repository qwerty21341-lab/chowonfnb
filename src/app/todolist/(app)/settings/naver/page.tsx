import { PlatformOnboardingPage } from "@/features/settings/PlatformOnboardingPage";

export default function NaverOnboardingPage() {
  return (
    <PlatformOnboardingPage
      config={{
        platform: "naver",
        platformName: "네이버",
        platformColor: "#03C75A",
        platformLogo: "N",
      }}
    />
  );
}
