"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Edit,
  ListFilter,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, Event, Venue } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/lib/auth";
import { useFlash } from "@/components/FlashProvider";
import { formatDateTime, getEventStatus } from "../_config/format";
import {
  emptyEventForm,
  EventForm,
  EventFormFields,
  toDateTimeLocal,
  toEventPayload,
} from "../_components/event-form-fields";

function toEventForm(event?: Event): EventForm {
  if (!event) return emptyEventForm;
  return {
    title: event.title || "",
    description: event.description || "",
    banner_url: event.banner_url || "",
    venue_id: event.venue_id || "",
    starts_at: toDateTimeLocal(event.starts_at),
    ends_at: toDateTimeLocal(event.ends_at),
    is_published: event.is_published ?? true,
  };
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Upcoming" | "Ongoing" | "Past"
  >("All");
  const [publishedFilter, setPublishedFilter] = useState<
    "All" | "Published" | "Draft"
  >("All");
  const [venueFilter, setVenueFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(emptyEventForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEvents = () => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("limit", "10");
    queryParams.append("refresh", "1");

    if (search) {
      queryParams.append("q", search.trim());
    }
    if (statusFilter !== "All") {
      queryParams.append("status", statusFilter);
    }
    if (publishedFilter !== "All") {
      queryParams.append("published", publishedFilter);
    }
    if (venueFilter !== "All") {
      queryParams.append("venueName", venueFilter);
    }

    api<{ data: Event[]; total: number; page: number; limit: number; totalPages: number }>(
      `/events?${queryParams.toString()}`
    )
      .then((res) => {
        setEvents(res.data || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((error) =>
        showFlash({
          type: "error",
          title: "Gagal memuat event",
          description:
            error instanceof Error
              ? error.message
              : "Data event tidak bisa dimuat.",
        }),
      );
  };

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user, page, search, statusFilter, publishedFilter, venueFilter]);

  useEffect(() => {
    if (!user) return;
    api<Venue[]>("/venues")
      .then(setVenues)
      .catch((error) =>
        showFlash({
          type: "error",
          title: "Gagal memuat venue",
          description:
            error instanceof Error
              ? error.message
              : "Data venue tidak bisa dimuat.",
        }),
      );
  }, [user, showFlash]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, publishedFilter, venueFilter]);

  const venueNames = useMemo(
    () =>
      Array.from(
        new Set(
          venues.map((venue) => venue.name).filter(Boolean) as string[],
        ),
      ).sort(),
    [venues],
  );

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 2) {
        end = 4;
      } else if (page >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push("ellipsis");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "ellipsis") {
        return (
          <PaginationItem key={`ellipsis-${idx}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={p}>
          <PaginationLink
            href="#"
            isActive={p === page}
            onClick={(e) => {
              e.preventDefault();
              setPage(p as number);
            }}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setForm(emptyEventForm);
    setMessage("");
    setDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setForm(toEventForm(event));
    setMessage("");
    setDialogOpen(true);
  };

  const updateField = <T extends keyof EventForm>(
    field: T,
    value: EventForm[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = toEventPayload(form);
      if (editingEvent) {
        await api(`/admin/events/${editingEvent.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/admin/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      showFlash({
        type: "success",
        title: editingEvent ? "Event diperbarui" : "Event ditambahkan",
        description: "Perubahan event berhasil disimpan.",
      });
      loadEvents();
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Gagal menyimpan event.";
      setMessage(description);
      showFlash({ type: "error", title: "Gagal menyimpan event", description });
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event: Event) => {
    const confirmed = window.confirm(`Hapus event "${event.title}"?`);
    if (!confirmed) return;

    try {
      await api(`/admin/events/${event.id}`, { method: "DELETE" });
      showFlash({
        type: "success",
        title: "Event dihapus",
        description: `"${event.title}" berhasil dihapus.`,
      });
      loadEvents();
    } catch (error) {
      showFlash({
        type: "error",
        title: "Gagal menghapus event",
        description:
          error instanceof Error ? error.message : "Event tidak bisa dihapus.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-375 space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:items-end sm:justify-between">
        <div className="space-y-2 flex justify-between w-full items-center">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-md">
              Event Management
            </Badge>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <Calendar className="h-7 w-7 text-primary" />
              Kelola Event
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-1/2 sm:max-w-none">
              CRUD event dan update jadwal. Konfigurasi seating tersedia di menu
              Seating.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4 hidden sm:inline" />
            Tambah Event
          </Button>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto grow">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari event atau venue..."
                className="h-10 pl-9"
              />
            </div>
            <Button
              className="inline-block sm:hidden"
              variant="outline"
              onClick={() => setFilterOpen((prev) => !prev)}
            >
              <ListFilter
                className={`h-4 w-4 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out sm:contents ${
              filterOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden sm:contents">
              <div className="flex flex-col gap-3 sm:flex-row sm:contents pt-1 sm:pt-0">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                  className="h-10 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  <option value="All">Semua status</option>
                  <option value="Upcoming">Akan datang</option>
                  <option value="Ongoing">Sedang berjalan</option>
                  <option value="Past">Selesai</option>
                </select>
                <select
                  value={publishedFilter}
                  onChange={(event) =>
                    setPublishedFilter(
                      event.target.value as typeof publishedFilter,
                    )
                  }
                  className="h-10 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  <option value="All">Semua publikasi</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
                <select
                  value={venueFilter}
                  onChange={(event) => setVenueFilter(event.target.value)}
                  className="h-10 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary"
                >
                  <option value="All">Semua venue</option>
                  {venueNames.map((venue) => (
                    <option key={venue} value={venue}>
                      {venue}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border border-border/80 bg-card py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4 font-bold">Event</TableHead>
              <TableHead className="px-6 py-4 font-bold">Jadwal</TableHead>
              <TableHead className="px-6 py-4 font-bold">Venue</TableHead>
              <TableHead className="px-6 py-4 font-bold">Status</TableHead>
              <TableHead className="px-6 py-4 font-bold text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="hover:bg-muted/30">
                <TableCell className="px-6 py-4 text-left">
                  <div className="max-w-md">
                    <p className="truncate font-bold text-foreground">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.description || "Tidak ada deskripsi"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                  {formatDateTime(event.starts_at)}
                </TableCell>
                <TableCell className="px-6 py-4 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {event.venue_name || "TBA"}
                      {event.venue_city ? `, ${event.venue_city}` : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className="rounded-md">
                    {getEventStatus(event.starts_at, event.ends_at)}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => openEditDialog(event)}
                      aria-label="Edit event"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => deleteEvent(event)}
                      aria-label="Delete event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-6 py-10 text-center font-medium text-muted-foreground"
                >
                  Tidak ada event yang cocok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {renderPageNumbers()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Tambah Event"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi event yang akan tampil di katalog Festix.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEvent} className="grid gap-4 md:grid-cols-2">
            <EventFormFields
              form={form}
              venues={venues}
              onChange={updateField}
            />
            {message && (
              <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground md:col-span-2">
                {message}
              </p>
            )}
            <DialogFooter className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
