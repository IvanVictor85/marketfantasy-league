import { Metadata } from 'next';
import CacheDashboard from '@/components/admin/cache-dashboard';

export const metadata: Metadata = {
  title: 'Cache Dashboard - Admin',
  description: 'Monitoramento e gerenciamento do sistema de cache',
};

export default function CacheAdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CacheDashboard />
    </div>
  );
}