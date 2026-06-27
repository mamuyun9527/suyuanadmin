import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
} from '@mui/material';
import { api, type PageResult } from '../api/client';

export interface User {
  id: string;
  username: string;
  real_name: string | null;
  phone: string | null;
  email: string | null;
  role_name: string;
  merchant_id: string | null;
  merchant_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserForm {
  username: string;
  password: string;
  real_name: string;
  phone: string;
  email: string;
  role_id: string;
  merchant_id: string;
}

const emptyForm: UserForm = {
  username: '', password: '', real_name: '', phone: '', email: '', role_id: '', merchant_id: '',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const { data: usersData } = useQuery<PageResult<User>>({
    queryKey: ['users', keyword],
    queryFn: async () => (await api.get('/users', { params: { keyword } })).data,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/users/roles')).data,
  });

  const { data: merchants } = useQuery<PageResult<{ id: string; name: string }>>({
    queryKey: ['all-merchants'],
    queryFn: async () => (await api.get('/merchants', { params: { page_size: 999 } })).data,
  });

  interface CreateUserBody {
  username: string;
  password: string;
  real_name?: string;
  phone?: string;
  email?: string;
  role_id: number;
  merchant_id?: string;
}

const createMut = useMutation({
    mutationFn: (body: CreateUserBody) => api.post('/users', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpen(false); setForm(emptyForm); },
  });

  interface UpdateUserBody {
  real_name: string | null;
  phone: string | null;
  email: string | null;
  role_id: number | null;
  merchant_id: string | null;
}

const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) => api.put(`/users/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpen(false); setForm(emptyForm); setEditId(null); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.put(`/users/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleEdit = (user: User) => {
    setEditId(user.id);
    setForm({
      username: user.username, password: '', real_name: user.real_name || '',
      phone: user.phone || '', email: user.email || '',
      role_id: roles?.find((r: any) => r.name === user.role_name)?.id?.toString() || '',
      merchant_id: user.merchant_id || '',
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editId) {
      updateMut.mutate({
        id: editId,
        body: {
          real_name: form.real_name || null, phone: form.phone || null, email: form.email || null,
          role_id: form.role_id ? Number(form.role_id) : null, merchant_id: form.merchant_id || null,
        },
      });
    } else {
      const createBody = {
        username: form.username,
        password: form.password,
        real_name: form.real_name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        role_id: Number(form.role_id),
        merchant_id: form.merchant_id || undefined,
      };
      createMut.mutate(createBody);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">用户管理</Typography>
        <Button variant="contained" onClick={() => { setEditId(null); setForm(emptyForm); setOpen(true); }}>新建用户</Button>
      </Box>

      <TextField
        placeholder="搜索用户名或姓名"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        sx={{ mb: 2, width: 300 }}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户名</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>电话</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>所属商户</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersData?.items?.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.real_name || '-'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.role_name}</TableCell>
                <TableCell>{user.merchant_name || '-'}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.is_active}
                        onChange={(e) => toggleMut.mutate({ id: user.id, is_active: e.target.checked })}
                        disabled={user.role_name === 'super_admin'}
                      />
                    }
                    label={user.is_active ? '启用' : '停用'}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(user)} disabled={user.role_name === 'super_admin'}>编辑</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => { setOpen(false); setForm(emptyForm); setEditId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? '编辑用户' : '新建用户'}</DialogTitle>
        <DialogContent>
          {createMut.isError && <Alert severity="error" sx={{ mb: 2 }}>创建失败，用户名可能已存在</Alert>}
          {updateMut.isError && <Alert severity="error" sx={{ mb: 2 }}>更新失败</Alert>}

          <TextField
            fullWidth
            margin="dense"
            label="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            disabled={!!editId}
          />

          {!editId && (
            <TextField
              fullWidth
              margin="dense"
              label="密码"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          )}

          <TextField
            fullWidth
            margin="dense"
            label="姓名"
            value={form.real_name}
            onChange={(e) => setForm({ ...form, real_name: e.target.value })}
          />

          <TextField
            fullWidth
            margin="dense"
            label="电话"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <TextField
            fullWidth
            margin="dense"
            label="邮箱"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>角色</InputLabel>
            <Select
              label="角色"
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              required
            >
              {roles?.map((r: any) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>所属商户</InputLabel>
            <Select
              label="所属商户"
              value={form.merchant_id}
              onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
            >
              <MenuItem value="">无</MenuItem>
              {merchants?.items?.map((m: any) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setForm(emptyForm); setEditId(null); }}>取消</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>保存</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}