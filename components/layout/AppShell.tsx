'use client';

import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import AppToaster from '@/components/ui/AppToaster';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import InstallBanner, { ServiceWorkerRegister } from '@/components/layout/InstallBanner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <MobileNav />
      <AppToaster />
      <OnboardingWizard />
      <InstallBanner />
      <ServiceWorkerRegister />
    </>
  );
}
