'use client';

import { useState } from 'react';
import { adminService } from '@/services/admin.service';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { FileDown, Users, Briefcase, BarChart3, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (type: 'users' | 'jobs' | 'analytics') => {
    setDownloading(type);
    try {
      let blob: Blob;
      let filename = `report-${type}-${new Date().toISOString().split('T')[0]}`;

      if (type === 'users') {
        blob = await adminService.exportUsers();
        filename += '.xlsx';
      } else if (type === 'jobs') {
        blob = await adminService.exportJobs();
        filename += '.xlsx';
      } else {
        blob = await adminService.exportAnalytics('month');
        filename += '.pdf';
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast.success('Report downloaded successfully');
    } catch (error) {
      console.error(error);
      showToast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Reports & Exports</h1>
          <p className="text-[var(--text-muted)]">Generate and download system reports.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Report */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">User Directory</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Export a complete list of all registered users, including candidates and employers.
            </p>
            <Button
              className="mt-6"
              fullWidth
              variant="outline"
              isLoading={downloading === 'users'}
              disabled={!!downloading}
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={() => handleExport('users')}
            >
              Export users (Excel)
            </Button>
          </div>

          {/* Jobs Report */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Job Postings</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Export job data including status, applications count, and categories.
            </p>
            <Button
              className="mt-6"
              fullWidth
              variant="outline"
              isLoading={downloading === 'jobs'}
              disabled={!!downloading}
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={() => handleExport('jobs')}
            >
              Export Jobs (Excel)
            </Button>
          </div>

          {/* Analytics Report */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Platform Analytics</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Download a PDF summary of platform growth, engagement, and key metrics.
            </p>
            <Button
              className="mt-6"
              fullWidth
              variant="outline"
              isLoading={downloading === 'analytics'}
              disabled={!!downloading}
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={() => handleExport('analytics')}
            >
              Export Analytics (PDF)
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
