import DashboardLayout from '@/components/shared/DashboardLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}