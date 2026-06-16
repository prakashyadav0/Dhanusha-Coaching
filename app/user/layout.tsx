import DashboardLayout from '@/components/shared/DashboardLayout';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}