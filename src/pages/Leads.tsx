import React, { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import type {
  CrmEmailMessage,
  CrmEmailTemplate,
  CrmLead,
  CrmLeadStatus,
  GoogleCalendarBooking,
  GoogleUpcomingMeetingsResponse,
} from '../services/api';
import { useChai } from '../context/ChaiContext';

const statuses: CrmLeadStatus[] = ['new', 'contacted', 'booked', 'closed', 'lost'];

const statusMeta: Record<CrmLeadStatus, { label: string; dot: string; chart: string }> = {
  new: { label: 'New', dot: 'bg-accent-app', chart: 'var(--accent-app)' },
  contacted: { label: 'Contacted', dot: 'bg-primary-app', chart: 'var(--primary-app)' },
  booked: { label: 'Booked', dot: 'bg-emerald-500', chart: '#10b981' },
  closed: { label: 'Closed', dot: 'bg-text-secondary', chart: 'var(--text-secondary)' },
  lost: { label: 'Lost', dot: 'bg-red-500', chart: '#ef4444' },
};

const sourceOptions = ['manual', 'lead_form', 'booking', 'newsletter', 'contact_page', 'landing_page'];
const pageSize = 50;

const sourceLabel = (source: string) => source.replaceAll('_', ' ');

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-app/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app';

const controlCls =
  'w-full rounded-lg border border-border-app bg-surface-app px-3 py-2.5 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-secondary/60 focus:border-primary-app focus:ring-2 focus:ring-primary-app/20';

const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

const toLocalIsoWithOffset = (value: Date) => {
  const pad = (input: number) => String(input).padStart(2, '0');
  const offset = -value.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
};

export const Leads: React.FC = () => {
  const { addToast } = useChai();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNewLeadOpen, setNewLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [emailMessages, setEmailMessages] = useState<CrmEmailMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<GoogleCalendarBooking | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<GoogleUpcomingMeetingsResponse | null>(null);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [schedule, setSchedule] = useState({
    date: '',
    startTime: '',
    endTime: '',
    title: '',
    description: '',
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual',
    status: 'new' as CrmLeadStatus,
    notes: '',
  });

  const activeLeads = leads.filter(lead => lead.status !== 'closed' && lead.status !== 'lost').length;
  const bookedLeads = leads.filter(lead => lead.status === 'booked').length;
  const conversionRate = leads.length ? Math.round((bookedLeads / leads.length) * 100) : 0;
  const hasFilters = Boolean(search || statusFilter || sourceFilter);

  const leadsByStatus = useMemo(
    () =>
      statuses.reduce(
        (acc, status) => {
          acc[status] = leads.filter(lead => lead.status === status);
          return acc;
        },
        {} as Record<CrmLeadStatus, CrmLead[]>,
      ),
    [leads],
  );

  const statusChartData = useMemo(
    () =>
      statuses.map(status => ({
        status,
        name: statusMeta[status].label,
        value: leadsByStatus[status].length,
        fill: statusMeta[status].chart,
      })),
    [leadsByStatus],
  );

  const sourceChartData = useMemo(
    () =>
      sourceOptions
        .map(source => ({
          source: sourceLabel(source),
          leads: leads.filter(lead => lead.source === source).length,
        }))
        .filter(item => item.leads > 0),
    [leads],
  );

  const loadLeads = async () => {
    setLoading(true);
    try {
      const rows = await api.getCrmLeads({
        search,
        status: statusFilter,
        source: sourceFilter,
        limit: pageSize,
        offset,
      });
      setLeads(rows);
      if (selectedLead) {
        setSelectedLead(rows.find(item => item.id === selectedLead.id) || null);
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadError = useEffectEvent((error: unknown) => {
    addToast(error instanceof Error ? error.message : 'Failed to load leads', 'error');
  });

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      api
        .getCrmLeads({
          search,
          status: statusFilter,
          source: sourceFilter,
          limit: pageSize,
          offset,
        })
        .then(rows => {
          if (cancelled) return;
          setLeads(rows);
          setSelectedLead(current =>
            current ? rows.find(item => item.id === current.id) || null : null,
          );
        })
        .catch(handleLoadError)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, statusFilter, sourceFilter, offset]);

  useEffect(() => {
    api.getCrmTemplates(false).then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const loadUpcomingMeetings = async () => {
    setUpcomingLoading(true);
    try {
      setUpcomingMeetings(await api.getGoogleUpcomingMeetings({ days: 7, limit: 50 }));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load upcoming meetings', 'error');
    } finally {
      setUpcomingLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  // Escape closes the top-most layer: schedule dialog, then new-lead dialog, then drawer
  useEffect(() => {
    if (!scheduleOpen && !isNewLeadOpen && !drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (scheduleOpen) {
        if (!bookingSaving) setScheduleOpen(false);
      } else if (isNewLeadOpen) {
        setNewLeadOpen(false);
      } else {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scheduleOpen, isNewLeadOpen, drawerOpen, bookingSaving]);

  const handleCreateLead = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await api.createCrmLead(form);
      setLeads(prev => [created, ...prev]);
      setForm({ name: '', email: '', phone: '', source: 'manual', status: 'new', notes: '' });
      setNewLeadOpen(false);
      addToast('Lead created. Follow-up automations started.', 'success');
      inspectLead(created);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to create lead', 'error');
    }
  };

  const updateLead = async (lead: CrmLead, updates: Partial<CrmLead>) => {
    try {
      const updated = await api.updateCrmLead(lead.id, updates);
      setLeads(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      if (selectedLead?.id === updated.id) setSelectedLead(updated);
      addToast('Lead updated', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update lead', 'error');
    }
  };

  const inspectLead = async (lead: CrmLead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    setEmailMessages([]);
    setBooking(null);
    setDetailLoading(true);
    try {
      const [detail, messages, existingBooking] = await Promise.all([
        api.getCrmLead(lead.id),
        api.getCrmEmailMessages({ lead_id: lead.id, status: 'sent', limit: 100, offset: 0 }),
        api.getCrmLeadBooking(lead.id),
      ]);
      setSelectedLead(detail);
      setEmailMessages(messages);
      setBooking(existingBooking);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load lead details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const openSchedule = (lead: CrmLead, existingBooking?: GoogleCalendarBooking | null) => {
    setSelectedLead(lead);
    const activeBooking =
      existingBooking !== undefined
        ? existingBooking
        : selectedLead?.id === lead.id
          ? booking
          : null;
    const start = activeBooking ? new Date(activeBooking.start_time) : new Date(Date.now() + 60 * 60 * 1000);
    if (!activeBooking) start.setMinutes(0, 0, 0);
    const end = activeBooking ? new Date(activeBooking.end_time) : new Date(start.getTime() + 30 * 60 * 1000);
    const formatDate = (value: Date) => value.toLocaleDateString('en-CA');
    const formatTime = (value: Date) => value.toTimeString().slice(0, 5);
    setSchedule({
      date: formatDate(start),
      startTime: formatTime(start),
      endTime: formatTime(end),
      title: `Meeting with ${lead.name}`,
      description: activeBooking ? 'Rescheduled from admin panel' : '',
    });
    setScheduleOpen(true);
  };

  const bookLead = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLead) return;

    const start = new Date(`${schedule.date}T${schedule.startTime}`);
    const end = new Date(`${schedule.date}T${schedule.endTime}`);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end <= start) {
      addToast('Choose an end time after the start time.', 'error');
      return;
    }

    setBookingSaving(true);
    try {
      const payload = {
        start_time: toLocalIsoWithOffset(start),
        end_time: toLocalIsoWithOffset(end),
        timezone: getBrowserTimezone(),
        title: schedule.title || undefined,
        description: schedule.description || undefined,
      };
      const isRescheduling = Boolean(booking?.lead_id === selectedLead.id);
      const savedBooking = isRescheduling
        ? await api.rescheduleCrmLeadBooking(selectedLead.id, payload)
        : await api.bookCrmLead(selectedLead.id, payload);

      const bookedLead = { ...selectedLead, status: 'booked' as CrmLeadStatus };
      setBooking(savedBooking);
      setSelectedLead(bookedLead);
      setLeads(current => current.map(lead => (lead.id === bookedLead.id ? bookedLead : lead)));
      setScheduleOpen(false);
      loadUpcomingMeetings();
      addToast(isRescheduling ? 'Meeting rescheduled in Google Calendar.' : 'Meeting booked and Google invitation sent.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save booking', 'error');
    } finally {
      setBookingSaving(false);
    }
  };

  const cancelBooking = async () => {
    if (!selectedLead || !booking) return;
    if (!window.confirm('Cancel this booking and remove the Google Calendar event?')) return;

    try {
      await api.cancelCrmLeadBooking(selectedLead.id);
      setBooking(null);
      loadUpcomingMeetings();
      addToast('Booking cancelled and Google Calendar event removed.', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to cancel booking', 'error');
    }
  };

  const sendTemplate = async () => {
    if (!selectedLead || !selectedTemplateId) return;
    try {
      await api.sendCrmLeadEmail(selectedLead.id, { template_id: selectedTemplateId });
      addToast('Email queued for lead', 'success');
      const messages = await api.getCrmEmailMessages({
        lead_id: selectedLead.id,
        status: 'sent',
        limit: 100,
        offset: 0,
      });
      setEmailMessages(messages);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to send email', 'error');
    }
  };

  const retriggerAutomations = async () => {
    if (!selectedLead) return;
    try {
      await api.triggerCrmLeadAutomations(selectedLead.id, 'new_lead');
      addToast('Follow-up automations restarted', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to trigger automations', 'error');
    }
  };

  const moveLead = (lead: CrmLead, direction: -1 | 1) => {
    const index = statuses.indexOf(lead.status);
    const next = statuses[index + direction];
    if (next) updateLead(lead, { status: next });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setOffset(0);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary">Leads</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary">
            Track new inquiries, move them through your pipeline, and book meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={loadLeads} disabled={loading}>
            <RefreshCcw
              className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
            />
            Refresh
          </SecondaryButton>
          <PrimaryButton onClick={() => setNewLeadOpen(true)}>
            <Plus className="h-4 w-4" />
            Add lead
          </PrimaryButton>
        </div>
      </header>

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border-app bg-border-app shadow-sm sm:grid-cols-4">
        <Stat label="Total leads" value={String(leads.length)} />
        <Stat label="Active" value={String(activeLeads)} />
        <Stat label="Booked" value={String(bookedLeads)} />
        <Stat label="Booking rate" value={`${conversionRate}%`} />
      </dl>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Lead analytics"
            description="Pipeline health by stage and lead source"
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {statusChartData.map(entry => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              {sourceChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-app)" vertical={false} />
                    <XAxis dataKey="source" tickLine={false} axisLine={false} fontSize={10} stroke="var(--text-secondary)" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} stroke="var(--text-secondary)" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="leads" fill="var(--primary-app)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPanel>No source data yet.</EmptyPanel>
              )}
            </div>
          </div>
        </Card>

        <UpcomingMeetingsCard
          loading={upcomingLoading}
          days={upcomingMeetings?.days || 7}
          meetings={upcomingMeetings?.meetings || []}
          onRefresh={loadUpcomingMeetings}
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              aria-label="Search leads"
              value={search}
              onChange={event => {
                setLoading(true);
                setSearch(event.target.value);
                setOffset(0);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') loadLeads();
              }}
              placeholder="Search by name, email or notes"
              className={`${controlCls} pl-9`}
            />
          </div>
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={value => {
              setLoading(true);
              setStatusFilter(value);
              setOffset(0);
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...statuses.map(status => ({ value: status, label: statusMeta[status].label })),
            ]}
            className="lg:w-44"
          />
          <Select
            label="Filter by source"
            value={sourceFilter}
            onChange={value => {
              setLoading(true);
              setSourceFilter(value);
              setOffset(0);
            }}
            options={[
              { value: '', label: 'All sources' },
              ...sourceOptions.map(source => ({ value: source, label: sourceLabel(source) })),
            ]}
            className="lg:w-44"
          />
          {hasFilters && (
            <SecondaryButton onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear filters
            </SecondaryButton>
          )}
        </div>
        <p className="px-0.5 text-xs text-text-secondary" aria-live="polite">
          {hasFilters
            ? `${leads.length} ${leads.length === 1 ? 'lead matches' : 'leads match'} your filters`
            : leads.length
              ? `Showing ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`
              : loading
                ? 'Loading leads…'
                : 'No leads yet. Add your first lead to get started.'}
        </p>
      </div>

      {/* Pipeline board */}
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
        {statuses.map(status => {
          const stageLeads = leadsByStatus[status];
          const meta = statusMeta[status];

          return (
            <section
              key={status}
              aria-label={`${meta.label} leads`}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-border-app bg-hover-app/20"
            >
              <header className="flex items-center justify-between px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold text-text-primary">{meta.label}</h2>
                </div>
                <span className="rounded-md bg-hover-app px-1.5 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                  {loading ? '–' : stageLeads.length}
                </span>
              </header>

              <div className="flex-1 space-y-2 px-2.5 pb-2.5">
                {loading ? (
                  <>
                    <LeadSkeleton />
                    <LeadSkeleton />
                  </>
                ) : stageLeads.length === 0 ? (
                  <div className="flex min-h-[112px] items-center justify-center rounded-lg border border-dashed border-border-app px-4 text-center text-xs text-text-secondary">
                    No {meta.label.toLowerCase()} leads
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      status={status}
                      selected={drawerOpen && selectedLead?.id === lead.id}
                      onOpen={() => inspectLead(lead)}
                      onPrevious={() => moveLead(lead, -1)}
                      onNext={() => moveLead(lead, 1)}
                      onSchedule={() => openSchedule(lead)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-border-app pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">
          {leads.length ? `Leads ${offset + 1} to ${offset + leads.length}` : 'No leads on this page'}
        </p>
        <div className="flex gap-2">
          <SecondaryButton
            disabled={offset === 0 || loading}
            onClick={() => {
              setLoading(true);
              setOffset(current => Math.max(0, current - pageSize));
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </SecondaryButton>
          <SecondaryButton
            disabled={leads.length < pageSize || loading}
            onClick={() => {
              setLoading(true);
              setOffset(current => current + pageSize);
            }}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </SecondaryButton>
        </div>
      </div>

      {/* Lead drawer */}
      {drawerOpen && selectedLead && (
        <LeadInspector
          selectedLead={selectedLead}
          booking={booking}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          emailMessages={emailMessages}
          detailLoading={detailLoading}
          onClose={() => setDrawerOpen(false)}
          onStatusChange={status => updateLead(selectedLead, { status })}
          onNotesChange={notes => setSelectedLead({ ...selectedLead, notes })}
          onNotesBlur={() => updateLead(selectedLead, { notes: selectedLead.notes || '' })}
          onSchedule={() => openSchedule(selectedLead, booking)}
          onCancelBooking={cancelBooking}
          onSendTemplate={sendTemplate}
          onRetrigger={retriggerAutomations}
        />
      )}

      {/* Create lead */}
      {isNewLeadOpen && (
        <ModalShell title="Add lead" onClose={() => setNewLeadOpen(false)}>
          <form onSubmit={handleCreateLead} className="space-y-5">
            <ModalHeader
              icon={<UserPlus className="h-5 w-5" />}
              title="Add lead"
              subtitle="Enter their details. Follow-up automations start as soon as you save."
              onClose={() => setNewLeadOpen(false)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  required
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                  className={controlCls}
                />
              </Field>
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  className={controlCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={event => setForm({ ...form, phone: event.target.value })}
                  className={controlCls}
                />
              </Field>
              <Field label="Source">
                <Select
                  label="Lead source"
                  value={form.source}
                  onChange={value => setForm({ ...form, source: value })}
                  options={sourceOptions.map(source => ({ value: source, label: sourceLabel(source) }))}
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                placeholder="Anything worth remembering about this lead"
                rows={4}
                value={form.notes}
                onChange={event => setForm({ ...form, notes: event.target.value })}
                className={`${controlCls} resize-none`}
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-border-app pt-4">
              <SecondaryButton type="button" onClick={() => setNewLeadOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Add lead</PrimaryButton>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Schedule meeting */}
      {scheduleOpen && selectedLead && (
        <ModalShell
          title={booking?.lead_id === selectedLead.id ? 'Reschedule Google Meet' : 'Schedule Google Meet'}
          onClose={() => !bookingSaving && setScheduleOpen(false)}
        >
          <form onSubmit={bookLead} className="space-y-5">
            <ModalHeader
              icon={<CalendarDays className="h-5 w-5" />}
              title={booking?.lead_id === selectedLead.id ? 'Reschedule Google Meet' : 'Schedule Google Meet'}
              subtitle={`Google will email an invitation to ${selectedLead.email}.`}
              onClose={() => !bookingSaving && setScheduleOpen(false)}
            />

            <div className="flex items-center gap-3 rounded-lg border border-border-app bg-hover-app/20 p-3">
              <Avatar name={selectedLead.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{selectedLead.name}</p>
                <p className="truncate text-xs text-text-secondary">{selectedLead.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Date" required>
                <input
                  required
                  type="date"
                  value={schedule.date}
                  onChange={event => setSchedule({ ...schedule, date: event.target.value })}
                  className={controlCls}
                />
              </Field>
              <Field label="Start time" required>
                <input
                  required
                  type="time"
                  value={schedule.startTime}
                  onChange={event => setSchedule({ ...schedule, startTime: event.target.value })}
                  className={controlCls}
                />
              </Field>
              <Field label="End time" required>
                <input
                  required
                  type="time"
                  value={schedule.endTime}
                  onChange={event => setSchedule({ ...schedule, endTime: event.target.value })}
                  className={controlCls}
                />
              </Field>
            </div>

            <Field label="Title">
              <input
                value={schedule.title}
                onChange={event => setSchedule({ ...schedule, title: event.target.value })}
                className={controlCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={schedule.description}
                placeholder="Add an agenda or details for the invite"
                onChange={event => setSchedule({ ...schedule, description: event.target.value })}
                className={`${controlCls} resize-none`}
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-border-app pt-4">
              <SecondaryButton type="button" disabled={bookingSaving} onClick={() => setScheduleOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={bookingSaving}>
                {bookingSaving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                {bookingSaving
                  ? booking?.lead_id === selectedLead.id
                    ? 'Rescheduling…'
                    : 'Booking…'
                  : booking?.lead_id === selectedLead.id
                    ? 'Reschedule'
                    : 'Book and invite'}
              </PrimaryButton>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

/* ---------- Lead card ---------- */

const LeadCard = ({
  lead,
  selected,
  status,
  onOpen,
  onPrevious,
  onNext,
  onSchedule,
}: {
  lead: CrmLead;
  selected: boolean;
  status: CrmLeadStatus;
  onOpen: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSchedule: () => void;
}) => {
  const index = statuses.indexOf(status);

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-surface-app shadow-sm transition-colors ${
        selected ? 'border-primary-app ring-2 ring-primary-app/15' : 'border-border-app hover:border-text-secondary/40'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${lead.name}`}
        className={`flex w-full gap-3 p-3 text-left ${focusRing} rounded-t-lg`}
      >
        <Avatar name={lead.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-primary">{lead.name}</span>
          <span className="block truncate text-xs text-text-secondary">{lead.email}</span>
          <span className="mt-2 block line-clamp-2 text-xs leading-5 text-text-secondary">
            {lead.notes || `From ${sourceLabel(lead.source)}`}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between border-t border-border-app px-3 py-1.5">
        <span className="text-xs text-text-secondary">{new Date(lead.created_at).toLocaleDateString()}</span>
        <div className="flex items-center">
          {index > 0 && (
            <IconButton label="Move to previous stage" onClick={onPrevious}>
              <ArrowLeft className="h-4 w-4" />
            </IconButton>
          )}
          {status === 'contacted' ? (
            <IconButton label="Schedule meeting" onClick={onSchedule} accent>
              <CalendarDays className="h-4 w-4" />
            </IconButton>
          ) : (
            index < statuses.length - 1 && (
              <IconButton label="Move to next stage" onClick={onNext} accent>
                <ArrowRight className="h-4 w-4" />
              </IconButton>
            )
          )}
        </div>
      </div>
    </article>
  );
};

/* ---------- Lead drawer ---------- */

const LeadInspector = ({
  selectedLead,
  booking,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  emailMessages,
  detailLoading,
  onClose,
  onStatusChange,
  onNotesChange,
  onNotesBlur,
  onSchedule,
  onCancelBooking,
  onSendTemplate,
  onRetrigger,
}: {
  selectedLead: CrmLead;
  booking: GoogleCalendarBooking | null;
  templates: CrmEmailTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: (value: string) => void;
  emailMessages: CrmEmailMessage[];
  detailLoading: boolean;
  onClose: () => void;
  onStatusChange: (status: CrmLeadStatus) => void;
  onNotesChange: (notes: string) => void;
  onNotesBlur: () => void;
  onSchedule: () => void;
  onCancelBooking: () => void;
  onSendTemplate: () => void;
  onRetrigger: () => void;
}) => {
  const canSchedule = selectedLead.status !== 'closed' && selectedLead.status !== 'lost';

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`${selectedLead.name} profile`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border-app bg-surface-app shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border-app px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={selectedLead.name} large />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-text-primary">{selectedLead.name}</h2>
              <p className="mt-0.5 text-xs capitalize text-text-secondary">
                From {sourceLabel(selectedLead.source)}
              </p>
            </div>
          </div>
          <IconButton label="Close lead profile" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <ul className="space-y-2.5">
            <ContactRow icon={<Mail />} value={selectedLead.email} />
            {selectedLead.phone && <ContactRow icon={<Phone />} value={selectedLead.phone} />}
            <ContactRow icon={<Clock3 />} value={`Added ${new Date(selectedLead.created_at).toLocaleString()}`} />
          </ul>

          <Field label="Status">
            <Select
              label="Lead status"
              value={selectedLead.status}
              onChange={value => onStatusChange(value as CrmLeadStatus)}
              options={statuses
                .filter(status => status !== 'booked' || selectedLead.status === 'booked')
                .map(status => ({ value: status, label: statusMeta[status].label }))}
            />
          </Field>

          <Field label="Notes" hint="Saved when you click away.">
            <textarea
              rows={5}
              value={selectedLead.notes || ''}
              onChange={event => onNotesChange(event.target.value)}
              onBlur={onNotesBlur}
              placeholder="Add notes about this lead"
              className={`${controlCls} resize-none`}
            />
          </Field>

          <Section title="Meeting" description="Google Calendar and Meet">
            {booking ? (
              <div className="rounded-lg border border-border-app bg-hover-app/20 p-3.5">
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Booked for {new Date(booking.start_time).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={booking.meet_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-lg bg-primary-app px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 dark:text-black ${focusRing}`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Join Google Meet
                  </a>
                  {booking.calendar_html_link && (
                    <a
                      href={booking.calendar_html_link}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-border-app px-3.5 py-2 text-sm font-medium text-text-primary hover:bg-hover-app ${focusRing}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Calendar
                    </a>
                  )}
                  <SecondaryButton onClick={onSchedule}>
                    <RefreshCcw className="h-4 w-4" />
                    Reschedule
                  </SecondaryButton>
                  <DangerButton onClick={onCancelBooking}>
                    <Trash2 className="h-4 w-4" />
                    Cancel
                  </DangerButton>
                </div>
              </div>
            ) : canSchedule ? (
              <PrimaryButton onClick={onSchedule} className="w-full">
                <CalendarDays className="h-4 w-4" />
                Schedule Google Meet
              </PrimaryButton>
            ) : (
              <p className="rounded-lg border border-dashed border-border-app p-3 text-center text-xs text-text-secondary">
                Closed and lost leads can't be scheduled. Change the status to book a meeting.
              </p>
            )}
          </Section>

          <Section title="Follow-up" description="Send a template or restart automations">
            <div className="space-y-2">
              <Select
                label="Email template"
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                options={[
                  { value: '', label: 'Choose an email template' },
                  ...templates.map(template => ({ value: template.id, label: template.name })),
                ]}
              />
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton onClick={onSendTemplate} disabled={!selectedTemplateId}>
                  <Send className="h-4 w-4" />
                  Send email
                </PrimaryButton>
                <SecondaryButton onClick={onRetrigger}>
                  <RefreshCcw className="h-4 w-4" />
                  Restart automations
                </SecondaryButton>
              </div>
            </div>
          </Section>

          <Section title={`Sent emails (${emailMessages.length})`}>
            {detailLoading ? (
              <div className="space-y-2" aria-busy="true">
                <div className="h-14 animate-pulse rounded-lg bg-hover-app/60 motion-reduce:animate-none" />
                <div className="h-14 animate-pulse rounded-lg bg-hover-app/60 motion-reduce:animate-none" />
              </div>
            ) : emailMessages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-app p-4 text-center text-xs text-text-secondary">
                No emails sent to this lead yet. Choose a template above to send one.
              </p>
            ) : (
              <ul className="divide-y divide-border-app overflow-hidden rounded-lg border border-border-app">
                {emailMessages.map(message => (
                  <li key={message.id} className="p-3">
                    <p className="line-clamp-2 text-sm font-medium text-text-primary">
                      {message.subject || message.template_name || 'Email message'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(message.sent_at || message.created_at).toLocaleString()}
                      <span className="ml-auto capitalize text-emerald-500">{message.status}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
};

/* ---------- Building blocks ---------- */

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-border-app bg-surface-app p-5 shadow-sm ${className}`}>
    {children}
  </section>
);

const CardHeader = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-app/10 text-primary-app [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {description && <p className="mt-1 text-xs text-text-secondary">{description}</p>}
    </div>
  </div>
);

const UpcomingMeetingsCard = ({
  loading,
  days,
  meetings,
  onRefresh,
}: {
  loading: boolean;
  days: number;
  meetings: GoogleUpcomingMeetingsResponse['meetings'];
  onRefresh: () => void;
}) => (
  <Card>
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-app/10 text-accent-app">
            <CalendarDays className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-text-primary">Upcoming meetings</h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">Next {days} days from Google Calendar</p>
      </div>
      <IconButton label="Refresh meetings" onClick={onRefresh} accent>
        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
      </IconButton>
    </div>

    {loading ? (
      <div className="space-y-3" aria-busy="true">
        <LeadSkeleton />
        <LeadSkeleton />
      </div>
    ) : meetings.length === 0 ? (
      <EmptyPanel>No upcoming meetings found.</EmptyPanel>
    ) : (
      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {meetings.map(meeting => (
          <article key={meeting.event_id} className="rounded-lg border border-border-app bg-hover-app/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-text-primary">{meeting.title || 'Untitled meeting'}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatMeetingRange(meeting.start, meeting.end)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-app px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                {meeting.attendees?.length || 0} attendees
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {meeting.meet_url && (
                <a
                  href={meeting.meet_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-border-app bg-surface-app px-2.5 py-1.5 text-xs font-medium text-primary-app hover:bg-hover-app ${focusRing}`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Meet
                </a>
              )}
              {meeting.html_link && (
                <a
                  href={meeting.html_link}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-border-app bg-surface-app px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-hover-app hover:text-text-primary ${focusRing}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Calendar
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </Card>
);

const Select = ({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value) || options[0];

  return (
    <div className={`relative ${className}`} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border-app bg-surface-app px-3 py-2.5 text-left text-sm text-text-primary shadow-sm transition hover:bg-hover-app ${focusRing}`}
      >
        <span className="truncate capitalize">{selected?.label || label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-secondary transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border-app bg-surface-app p-1 shadow-xl"
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-hover-app ${
                option.value === value ? 'font-medium text-primary-app' : 'text-text-primary'
              }`}
            >
              <span className="truncate capitalize">{option.label}</span>
              {option.value === value && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border-app bg-hover-app/20 p-4 text-center text-xs text-text-secondary">
    {children}
  </div>
);

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-app bg-surface-app px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-medium text-text-primary">{label}</p>}
      {payload.map((item: any) => (
        <p key={item.dataKey || item.name} className="flex items-center gap-2 text-text-secondary">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.fill }} />
          <span>{item.name || item.dataKey}: </span>
          <span className="font-medium text-text-primary">{item.value}</span>
        </p>
      ))}
    </div>
  );
};

const formatMeetingRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) return 'Time unavailable';
  const day = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const startTime = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${startTime} - ${endTime}`;
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="border-t border-border-app pt-6">
    <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-surface-app px-5 py-4">
    <dt className="text-xs text-text-secondary">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-text-primary">{value}</dd>
  </div>
);

const Avatar = ({ name, large }: { name: string; large?: boolean }) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-full bg-primary-app/10 font-semibold text-primary-app ${
      large ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm'
    }`}
  >
    {name.slice(0, 1).toUpperCase()}
  </span>
);

const ContactRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <li className="flex min-w-0 items-center gap-2.5 text-sm text-text-secondary">
    <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
    <span className="min-w-0 break-all">{value}</span>
  </li>
);

const LeadSkeleton = () => (
  <div className="animate-pulse rounded-lg border border-border-app bg-surface-app p-3 motion-reduce:animate-none">
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-full bg-hover-app" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-hover-app" />
        <div className="h-3 w-36 rounded bg-hover-app" />
      </div>
    </div>
    <div className="mt-3 h-3 w-full rounded bg-hover-app" />
  </div>
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const PrimaryButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-app px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-black ${focusRing} ${className}`}
  />
);

const SecondaryButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-app bg-surface-app px-3.5 py-2 text-sm font-medium text-text-primary transition hover:bg-hover-app disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${className}`}
  />
);

const DangerButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${className}`}
  />
);

const IconButton = ({
  label,
  accent,
  className = '',
  children,
  ...props
}: ButtonProps & { label: string; accent?: boolean }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    {...props}
    className={`flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-hover-app ${
      accent ? 'text-primary-app' : 'text-text-secondary hover:text-text-primary'
    } ${focusRing} ${className}`}
  >
    {children}
  </button>
);

const ModalShell = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-app bg-surface-app p-6 shadow-2xl">
      {children}
    </div>
  </div>
);

const ModalHeader = ({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-app/10 text-primary-app ring-1 ring-primary-app/20">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-text-secondary">{subtitle}</p>
      </div>
    </div>
    <IconButton label="Close" onClick={onClose}>
      <X className="h-4 w-4" />
    </IconButton>
  </div>
);

const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-text-primary">
      {label}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-red-400">
          *
        </span>
      )}
    </span>
    {children}
    {hint && <span className="block text-xs text-text-secondary">{hint}</span>}
  </label>
);
