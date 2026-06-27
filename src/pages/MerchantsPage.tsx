import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { api, type Merchant } from '../api/client';

const emptyForm = {
  name: '', credit_code: '', legal_person: '', contact_name: '', contact_phone: '', address: '', description: '',
};

export default function MerchantsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => (await api.get('/merchants')).data,
  });

  const createMut = useMutation({
    mutationFn: (body: typeof emptyForm) => api.post('/merchants', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['merchants'] }); setOpen(false); setForm(emptyForm); },
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">商户管理</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>新建商户</Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>商户名称</TableCell>
              <TableCell>信用代码</TableCell>
              <TableCell>负责人</TableCell>
              <TableCell>电话</TableCell>
              <TableCell>状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>加载中...</TableCell></TableRow>
            ) : data?.items?.map((m: Merchant) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.credit_code}</TableCell>
                <TableCell>{m.contact_name}</TableCell>
                <TableCell>{m.contact_phone}</TableCell>
                <TableCell>{m.is_active ? '启用' : '停用'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建商户</DialogTitle>
        <DialogContent>
          {createMut.isError && <Alert severity="error" sx={{ mb: 2 }}>创建失败，请检查信用代码是否重复</Alert>}
          {(['name', 'credit_code', 'legal_person', 'contact_name', 'contact_phone', 'address'] as const).map((k) => (
            <TextField
              key={k}
              fullWidth
              margin="dense"
              label={k === 'name' ? '商户名称' : k === 'credit_code' ? '统一社会信用代码' : k === 'legal_person' ? '法定代表人' : k === 'contact_name' ? '负责人' : k === 'contact_phone' ? '负责人电话' : '地址'}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              required={['name', 'credit_code', 'contact_name', 'contact_phone'].includes(k)}
            />
          ))}
          <TextField fullWidth margin="dense" label="企业介绍" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>保存</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
