import { PlatformOnboardingPage } from "@/features/settings/PlatformOnboardingPage";

export default function KakaoOnboardingPage() {
  return (
    <PlatformOnboardingPage
      config={{
        platform: "kakao",
        platformName: "카카오",
        platformColor: "#FEE500",
        platformLogo: "K",
      }}
    />
  );
}
