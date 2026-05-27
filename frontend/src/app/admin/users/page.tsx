'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, Loader2, Plus, Search, ShieldAlert, Trash2, Users } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, User } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFlash } from '@/components/FlashProvider';

type UserForm = {
  full_name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
};

type UserApiRecord = User & {
  name?: string;
  fullName?: string;
};

const emptyUserForm: UserForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'USER',
};

function normalizeUser(user: UserApiRecord): User {
  const values = [user.full_name, user.fullName, user.name].filter(Boolean) as string[];
  const isEmailValue = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const email = user.email || values.find(isEmailValue) || '';
  const fullName = values.find((value) => value !== email && !isEmailValue(value)) || '';

  return {
    ...user,
    email,
    full_name: fullName,
  };
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showFlash } = useFlash();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const canManageUsers = currentUser?.role === 'SUPER_ADMIN';

  const loadUsers = () => {
    if (!canManageUsers) return;
    api<UserApiRecord[]>('/admin/users?refresh=1')
      .then((data) => setUsers(data.map(normalizeUser)))
      .catch((error) => showFlash({
        type: 'error',
        title: 'Gagal memuat user',
        description: error instanceof Error ? error.message : 'Data user tidak bisa dimuat.',
      }));
  };

  useEffect(() => {
    loadUsers();
  }, [canManageUsers, showFlash]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [users, search]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(emptyUserForm);
    setMessage('');
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    const normalizedUser = normalizeUser(user);
    setEditingUser(user);
    setForm({
      full_name: normalizedUser.full_name,
      email: normalizedUser.email,
      password: '',
      role: normalizedUser.role as UserForm['role'],
    });
    setMessage('');
    setDialogOpen(true);
  };

  const updateField = <T extends keyof UserForm>(field: T, value: UserForm[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editingUser) {
        await api(`/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      showFlash({
        type: 'success',
        title: editingUser ? 'User diperbarui' : 'User ditambahkan',
        description: 'Data user berhasil disimpan.',
      });
      loadUsers();
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Gagal menyimpan user.';
      setMessage(description);
      showFlash({ type: 'error', title: 'Gagal menyimpan user', description });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      showFlash({
        type: 'error',
        title: 'User tidak bisa dihapus',
        description: 'Akun yang sedang aktif tidak bisa dihapus dari halaman ini.',
      });
      return;
    }

    const confirmed = window.confirm(`Hapus user "${user.full_name || user.email}"?`);
    if (!confirmed) return;

    try {
      await api(`/admin/users/${user.id}`, { method: 'DELETE' });
      showFlash({
        type: 'success',
        title: 'User dihapus',
        description: `${user.full_name || user.email} berhasil dihapus.`,
      });
      loadUsers();
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal menghapus user',
        description: error instanceof Error ? error.message : 'User tidak bisa dihapus.',
      });
    }
  };

  if (!canManageUsers) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="items-center rounded-lg border-destructive/30 p-8 text-center shadow-none">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">Super admin only</h1>
          <p className="text-sm text-muted-foreground">Halaman manajemen user hanya tersedia untuk role SUPER_ADMIN.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-md">Super Admin</Badge>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Users className="h-7 w-7 text-primary" />
            Manage Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">CRUD pengguna dan pengaturan role akses Festix.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Cari user..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah User
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-lg border-border/80 bg-card py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Nama</TableHead>
              <TableHead className="px-6 py-4">Email</TableHead>
              <TableHead className="px-6 py-4">Role</TableHead>
              <TableHead className="px-6 py-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-6 py-4 font-semibold">{user.full_name}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'outline'} className="rounded-md">{user.role}</Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon-sm" onClick={() => openEditDialog(user)} aria-label="Edit user">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={() => deleteUser(user)} aria-label="Delete user">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  Belum ada user yang ditampilkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
            <DialogDescription>Password wajib untuk user baru, opsional saat edit.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nama Lengkap</Label>
              <Input id="user-name" value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(value) => updateField('role', value as UserForm['role'])}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {message && <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{message}</p>}
            <DialogFooter>
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
