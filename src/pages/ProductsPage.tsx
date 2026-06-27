import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { api, type Merchant, type Product } from '../api/client';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ merchant_id: '', name: '', spec: '', category: '', origin: '', shelf_life: '', description: '' });

  const { data: merchants } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => (await api.get('/merchants', { params: { page_size: 100 } })).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/products', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setOpen(false); },
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">商品管理</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>新建商品</Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>商品名称</TableCell>
              <TableCell>商户</TableCell>
              <TableCell>品类</TableCell>
              <TableCell>规格</TableCell>
              <TableCell>产地</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>加载中...</TableCell></TableRow>
            ) : data?.items?.map((p: Product) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.merchant_name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.spec}</TableCell>
                <TableCell>{p.origin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建商品</DialogTitle>
        <DialogContent>
          {createMut.isError && <Alert severity="error" sx={{ mb: 2 }}>创建失败</Alert>}
          <FormControl fullWidth margin="dense">
            <InputLabel>所属商户</InputLabel>
            <Select label="所属商户" value={form.merchant_id} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}>
              {merchants?.items?.map((m: Merchant) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth margin="dense" label="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField fullWidth margin="dense" label="品类" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <TextField fullWidth margin="dense" label="规格" value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
          <TextField fullWidth margin="dense" label="产地" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          <TextField fullWidth margin="dense" label="保质期" value={form.shelf_life} onChange={(e) => setForm({ ...form, shelf_life: e.target.value })} />
          <TextField fullWidth margin="dense" label="描述" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={!form.merchant_id || !form.name}>保存</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
