'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Edit, Loader2, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFlash } from '@/components/FlashProvider';
import { api, Venue } from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type VenueForm = {
  name: string;
  address: string;
  city: string;
  capacity: string;
};

const emptyVenueForm: VenueForm = {
  name: '',
  address: '',
  city: '',
  capacity: '0',
};

function toVenueForm(venue?: Venue): VenueForm {
  if (!venue) return emptyVenueForm;
  return {
    name: venue.name || '',
    address: venue.address || '',
    city: venue.city || '',
    capacity: String(venue.capacity ?? 0),
  };
}

function toVenuePayload(form: VenueForm) {
  return {
    name: form.name.trim(),
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    capacity: Number(form.capacity || 0),
  };
}

export default function AdminVenuesPage() {
  const { showFlash } = useFlash();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueForm>(emptyVenueForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadVenues = () => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', '10');
    if (debouncedSearch) {
      queryParams.append('q', debouncedSearch);
    }

    api<{ data: Venue[]; total: number; page: number; limit: number; totalPages: number }>(
      `/venues?${queryParams.toString()}`
    )
      .then((res) => {
        setVenues(res.data || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((error) => showFlash({
        type: 'error',
        title: 'Gagal memuat venue',
        description: error instanceof Error ? error.message : 'Data venue tidak bisa dimuat.',
      }));
  };

  useEffect(() => {
    loadVenues();
  }, [page, debouncedSearch]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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
        pages.push('ellipsis');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === 'ellipsis') {
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
    setEditingVenue(null);
    setForm(emptyVenueForm);
    setMessage('');
    setDialogOpen(true);
  };

  const openEditDialog = (venue: Venue) => {
    setEditingVenue(venue);
    setForm(toVenueForm(venue));
    setMessage('');
    setDialogOpen(true);
  };

  const updateField = <T extends keyof VenueForm>(field: T, value: VenueForm[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveVenue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = toVenuePayload(form);
      if (editingVenue) {
        await api(`/admin/venues/${editingVenue.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/admin/venues', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      showFlash({
        type: 'success',
        title: editingVenue ? 'Venue diperbarui' : 'Venue ditambahkan',
        description: 'Data venue berhasil disimpan.',
      });
      loadVenues();
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Gagal menyimpan venue.';
      setMessage(description);
      showFlash({ type: 'error', title: 'Gagal menyimpan venue', description });
    } finally {
      setSaving(false);
    }
  };

  const deleteVenue = async (venue: Venue) => {
    const confirmed = window.confirm(`Hapus venue "${venue.name}"?`);
    if (!confirmed) return;

    try {
      await api(`/admin/venues/${venue.id}`, { method: 'DELETE' });
      showFlash({
        type: 'success',
        title: 'Venue dihapus',
        description: `"${venue.name}" berhasil dihapus.`,
      });
      loadVenues();
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal menghapus venue',
        description: error instanceof Error ? error.message : 'Venue tidak bisa dihapus.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-md">Venue Management</Badge>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Building2 className="h-7 w-7 text-primary" />
            Kelola Venue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">CRUD venue berdasarkan schema: nama, alamat, kota, dan kapasitas.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari venue atau kota..."
              className="h-10 pl-9"
            />
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Venue
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border border-border/80 bg-card py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4 font-bold">Nama</TableHead>
              <TableHead className="px-6 py-4 font-bold">Alamat</TableHead>
              <TableHead className="px-6 py-4 font-bold">Kota</TableHead>
              <TableHead className="px-6 py-4 font-bold">Kapasitas</TableHead>
              <TableHead className="px-6 py-4 font-bold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <TableRow key={venue.id} className="hover:bg-muted/30">
                <TableCell className="px-6 py-4 font-bold text-foreground">{venue.name}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex max-w-md items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{venue.address || 'Tidak ada alamat'}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground">{venue.city || '-'}</TableCell>
                <TableCell className="px-6 py-4 text-sm font-semibold">{venue.capacity ?? 0}</TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon-sm" onClick={() => openEditDialog(venue)} aria-label="Edit venue">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={() => deleteVenue(venue)} aria-label="Delete venue">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {venues.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-10 text-center font-medium text-muted-foreground">
                  Tidak ada venue yang cocok.
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
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
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
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVenue ? 'Edit Venue' : 'Tambah Venue'}</DialogTitle>
            <DialogDescription>Kolom mengikuti schema tabel venues: name, address, city, capacity.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveVenue} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="venue-name">Nama Venue</Label>
              <Input
                id="venue-name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="venue-address">Alamat</Label>
              <Input
                id="venue-address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue-city">Kota</Label>
              <Input
                id="venue-city"
                value={form.city}
                maxLength={100}
                onChange={(event) => updateField('city', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue-capacity">Kapasitas</Label>
              <Input
                id="venue-capacity"
                type="number"
                min={0}
                step={1}
                value={form.capacity}
                onChange={(event) => updateField('capacity', event.target.value)}
              />
            </div>
            {message && <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground md:col-span-2">{message}</p>}
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
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
