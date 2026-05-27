'use client';

import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Venue } from '@/lib/api';

export type EventForm = {
  title: string;
  description: string;
  banner_url: string;
  venue_id: string;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
};

export const emptyEventForm: EventForm = {
  title: '',
  description: '',
  banner_url: '',
  venue_id: '',
  starts_at: '',
  ends_at: '',
  is_published: true,
};

export function toDateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function toEventPayload(form: EventForm) {
  const startsAt = new Date(form.starts_at);
  const endsAt = new Date(form.ends_at);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error('Tanggal mulai dan selesai wajib dipilih.');
  }

  if (endsAt <= startsAt) {
    throw new Error('Tanggal selesai harus lebih besar dari tanggal mulai.');
  }

  return {
    title: form.title,
    description: form.description || undefined,
    banner_url: form.banner_url || undefined,
    venue_id: form.venue_id || undefined,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    is_published: form.is_published,
  };
}

function mergeDateAndTime(currentValue: string, selectedDate: Date) {
  const current = currentValue ? new Date(currentValue) : new Date();
  const next = new Date(selectedDate);
  next.setHours(current.getHours(), current.getMinutes(), 0, 0);
  return toDateTimeLocal(next.toISOString());
}

function mergeTime(currentValue: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const current = currentValue ? new Date(currentValue) : new Date();
  current.setHours(hours || 0, minutes || 0, 0, 0);
  return toDateTimeLocal(current.toISOString());
}

function formatDateLabel(value: string) {
  if (!value) return 'Pilih tanggal';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function timeValue(value: string) {
  if (!value) return '19:00';
  return toDateTimeLocal(value).slice(11, 16);
}

type DateTimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function DateTimePickerField({ label, value, onChange }: DateTimePickerFieldProps) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-[1fr_112px] gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="h-9 justify-start gap-2 text-left font-normal">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{formatDateLabel(value)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <Calendar
              selected={selectedDate}
              month={selectedDate}
              onSelect={(date) => onChange(mergeDateAndTime(value, date))}
            />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Clock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="time"
            value={timeValue(value)}
            onChange={(event) => onChange(mergeTime(value, event.target.value))}
            className="h-9 pl-8"
            required
          />
        </div>
      </div>
    </div>
  );
}

type EventFormFieldsProps = {
  form: EventForm;
  venues: Venue[];
  onChange: <T extends keyof EventForm>(field: T, value: EventForm[T]) => void;
};

export function EventFormFields({ form, venues, onChange }: EventFormFieldsProps) {
  return (
    <>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="event-title">Nama Event</Label>
        <Input id="event-title" value={form.title} onChange={(event) => onChange('title', event.target.value)} required />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="event-description">Deskripsi</Label>
        <textarea
          id="event-description"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="event-banner">Banner URL</Label>
        <Input id="event-banner" value={form.banner_url} onChange={(event) => onChange('banner_url', event.target.value)} placeholder="https://..." />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Venue</Label>
        <Select value={form.venue_id || 'none'} onValueChange={(value) => onChange('venue_id', value === 'none' ? '' : value)}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Pilih venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tanpa venue</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name}{venue.city ? `, ${venue.city}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DateTimePickerField label="Mulai" value={form.starts_at} onChange={(value) => onChange('starts_at', value)} />
      <DateTimePickerField label="Selesai" value={form.ends_at} onChange={(value) => onChange('ends_at', value)} />

      <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 md:col-span-2">
        <Checkbox
          checked={form.is_published}
          onCheckedChange={(checked) => onChange('is_published', checked === true)}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">Publish event</span>
          <span className="block text-xs text-muted-foreground">Event yang tidak dipublish tidak akan tampil di daftar `/events` saat ini.</span>
        </span>
      </label>
    </>
  );
}
