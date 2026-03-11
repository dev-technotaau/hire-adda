'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Mail, Eye, Send, Loader2, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tooltip from '@/components/ui/Tooltip';
import api from '@/lib/api';
import { API } from '@/constants/api';

interface EmailTemplate {
  key: string;
  description: string;
}

interface PreviewData {
  subject: string;
  html: string;
  text: string;
}

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [testSent, setTestSent] = useState(false);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const res = await api.get(API.ADMIN.EMAIL_TEMPLATES);
      return res.data as { status: string; data: EmailTemplate[] };
    },
  });

  const templates = templatesData?.data ?? [];

  const { data: previewData, isFetching: isPreviewLoading } = useQuery({
    queryKey: ['admin', 'email-preview', selectedTemplate],
    queryFn: async () => {
      const res = await api.post(API.ADMIN.EMAIL_TEMPLATES_PREVIEW, {
        templateName: selectedTemplate,
      });
      return res.data as { status: string; data: PreviewData };
    },
    enabled: !!selectedTemplate,
  });

  const preview = previewData?.data;

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(API.ADMIN.EMAIL_TEMPLATES_TEST, {
        templateName: selectedTemplate,
        toEmail: testEmail,
      });
      return res.data;
    },
    onSuccess: () => {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    },
  });

  return (
    <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Email Templates</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Preview and test email templates used across the platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Template List */}
          <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Templates</h2>}>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
                ))}
              </div>
            ) : (
              <div className="max-h-[calc(100vh-16rem)] space-y-1 overflow-y-auto">
                {templates.map((tpl) => (
                  <Tooltip key={tpl.key} content={`Preview ${tpl.key} template`}>
                    <button
                      onClick={() => setSelectedTemplate(tpl.key)}
                      className={`w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedTemplate === tpl.key
                          ? 'bg-primary/10 text-primary'
                          : 'text-[var(--text)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{tpl.key}</p>
                          <p className="text-xs text-[var(--text-muted)]">{tpl.description}</p>
                        </div>
                      </div>
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}
          </Card>

          {/* Preview + Test */}
          <div className="space-y-6 lg:col-span-2">
            {selectedTemplate ? (
              <>
                <Card
                  header={
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="text-primary h-5 w-5" />
                        <h2 className="text-lg font-semibold text-[var(--text)]">Preview</h2>
                      </div>
                      {preview && (
                        <span className="text-sm text-[var(--text-muted)]">
                          Subject: {preview.subject}
                        </span>
                      )}
                    </div>
                  }
                >
                  {isPreviewLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="text-primary h-6 w-6 animate-spin" />
                    </div>
                  ) : preview ? (
                    <div className="rounded-lg border border-[var(--border)] bg-white">
                      <iframe
                        srcDoc={preview.html}
                        title="Email Preview"
                        className="h-96 w-full rounded-lg"
                        sandbox=""
                      />
                    </div>
                  ) : null}
                </Card>

                <Card
                  header={
                    <div className="flex items-center gap-2">
                      <Send className="text-primary h-5 w-5" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Send Test Email</h2>
                    </div>
                  }
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      tooltip="Send a test email to the specified address"
                      onClick={() => sendTestMutation.mutate()}
                      isLoading={sendTestMutation.isPending}
                      disabled={!testEmail || !selectedTemplate}
                    >
                      {testSent ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Sent
                        </span>
                      ) : (
                        'Send Test'
                      )}
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <Card>
                <div className="flex h-64 flex-col items-center justify-center text-[var(--text-muted)]">
                  <Mail className="mb-3 h-12 w-12 opacity-30" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
