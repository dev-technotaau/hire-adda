'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Tabs from '@/components/ui/Tabs';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PAGINATION } from '@/constants/config';
import type { Notification, NotificationType } from '@/types/notification';

const typeIcons: Record<NotificationType, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeColors: Record<NotificationType, string> = {
  INFO: 'text-[var(--info)] bg-blue-50',
  SUCCESS: 'text-[var(--success)] bg-green-50',
  WARNING: 'text-[var(--warning)] bg-amber-50',
  ERROR: 'text-[var(--error)] bg-red-50',
};

const filterTabs = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'INFO', label: 'Info' },
  { key: 'SUCCESS', label: 'Success' },
  { key: 'WARNING', label: 'Warning' },
  { key: 'ERROR', label: 'Error' },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const queryFilters = {
    page,
    limit: PAGINATION.NOTIFICATIONS_PER_PAGE,
    ...(filter === 'UNREAD' ? { isRead: false } : {}),
    ...(!['ALL', 'UNREAD'].includes(filter) ? { type: filter as NotificationType } : {}),
  };

  const { data, isLoading } = useNotifications(queryFilters);
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const notifications = data?.data?.items || [];
  const pagination = data?.data;

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  return (
    <DashboardLayout requiredRole={['CANDIDATE', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Notifications</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Stay updated on your activity</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} tooltip="Mark all notifications as read">
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All Read
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Tabs
            tabs={filterTabs}
            activeTab={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <Skeleton variant="text" lines={2} />
              </Card>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={() => handleMarkRead(notification.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                filter === 'UNREAD' ? "You're all caught up!" : 'No notifications in this category.'
              }
            />
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            totalItems={pagination.total}
            pageSize={pagination.limit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const Icon = typeIcons[notification.type] || Info;
  const colors = typeColors[notification.type] || 'text-[var(--info)] bg-blue-50';
  const [iconColor, iconBg] = colors.split(' ');

  const content = (
    <Card
      className={cn(
        'transition-all hover:shadow-sm',
        !notification.isRead && 'border-l-primary border-l-4',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={cn(
                  'text-sm',
                  !notification.isRead
                    ? 'font-semibold text-[var(--text)]'
                    : 'font-medium text-[var(--text-secondary)]',
                )}
              >
                {notification.title}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <Tooltip content="Mark as read">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMarkRead();
                  }}
                  className="hover:text-primary shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)]"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              {formatRelativeDate(notification.createdAt)}
            </span>
            {notification.category && (
              <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {notification.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return notification.link ? <Link href={notification.link}>{content}</Link> : content;
}
