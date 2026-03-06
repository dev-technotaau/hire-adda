'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { showToast } from '@/components/ui/Toast';
import { ticketService } from '@/services/ticket.service';
import type { ApiError } from '@/types/api';
import type { TicketCategory } from '@/types/ticket';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: 'support@talentbridge.com',
    description: 'We typically respond within 24 hours',
  },
  {
    icon: Phone,
    title: 'Call Us',
    detail: '+91 1800-123-4567',
    description: 'Toll-free, available during office hours',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    detail: 'Bangalore, Karnataka, India',
    description: 'Koramangala, 4th Block, Bangalore 560034',
  },
  {
    icon: Clock,
    title: 'Office Hours',
    detail: 'Mon - Fri, 9:00 AM - 6:00 PM IST',
    description: 'Closed on weekends and public holidays',
  },
];

const categoryOptions = [
  { value: 'GENERAL', label: 'General Inquiry' },
  { value: 'TECHNICAL', label: 'Technical Support' },
  { value: 'BILLING', label: 'Billing & Payments' },
  { value: 'BUG_REPORT', label: 'Report a Bug' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'ACCOUNT', label: 'Account Issue' },
  { value: 'OTHER', label: 'Other' },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '' as '' | TicketCategory,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.subject || !form.message) {
      showToast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await ticketService.createGuestTicket({
        name: form.name,
        email: form.email,
        subject: form.subject,
        description: form.message,
        category: (form.category || 'GENERAL') as TicketCategory,
      });
      setTicketNumber(result.data.ticketNumber);
      showToast.success(
        `Ticket ${result.data.ticketNumber} created!`,
        'We will respond within 24 hours.',
      );
      setForm({ name: '', email: '', subject: '', message: '', category: '' });
    } catch (err) {
      const error = err as unknown as ApiError;
      showToast.error(error?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
              Have a question, feedback, or need help? We&apos;d love to hear from you. Our team is
              here to assist you with anything you need.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[var(--text)]">Send Us a Message</h2>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Fill out the form below and we will get back to you as soon as possible.
                </p>

                {ticketNumber && (
                  <div className="mb-6 rounded-lg border border-[var(--success)] bg-[var(--success-light)] p-4">
                    <p className="font-semibold text-[var(--success)]">
                      Ticket Created Successfully!
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Your ticket number is{' '}
                      <span className="font-mono font-bold text-[var(--text)]">{ticketNumber}</span>
                      . We will respond within 24 hours. Please save this number for reference.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input
                      label="Subject"
                      name="subject"
                      placeholder="Brief summary of your issue"
                      value={form.subject}
                      onChange={handleChange}
                      required
                    />
                    <Select
                      label="Category"
                      options={categoryOptions}
                      value={form.category}
                      onChange={(v) => setForm((prev) => ({ ...prev, category: v as '' | TicketCategory }))}
                      placeholder="Select a category"
                    />
                  </div>

                  <Textarea
                    label="Message"
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  />

                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Send Message
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {contactInfo.map((info) => (
                  <div
                    key={info.title}
                    className="rounded-xl border border-[var(--border)] bg-white p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-primary-light flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                        <info.icon className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text)]">{info.title}</h3>
                        <p className="text-primary mt-1 font-medium">{info.detail}</p>
                        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
