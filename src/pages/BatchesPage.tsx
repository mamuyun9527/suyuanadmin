import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormHelperText, InputLabel, MenuItem, Paper, Select,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { api, TRACE_MODE_LABEL, type Batch, type Product, type TraceCode, type TraceMode } from '../api/client';

export default function BatchesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [codes, setCodes] = useState<TraceCode[]>([]);
  const [codeForm, setCodeForm] = useState<{ trace_mode: TraceMode; quantity: number }>({ trace_mode: 'per_batch', quantity: 100 });

  const [form, setForm] = useState({
    product_id: '', batch_no: '', trace_mode: 'per_batch' as TraceMode,
    planting_enterprise: '', planting_contact: '', planting_phone: '',
    processing_enterprise: '', processing_contact: '', processing_phone: '',
    planting_base: '', seed_source: '', processing_method: '',
    production_date: '', plant_date: '', harvest_date: '', processing_date: '', sales_date: '',
    sales_merchant: '',
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products', { params: { page_size: 100 } })).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await api.get('/batches')).data,
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/batches', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setCreateOpen(false); },
  });

  const generateMut = useMutation({
    mutationFn: (batchId: string) => api.post(`/batches/${batchId}/trace-codes/generate`, codeForm),
    onSuccess: (res) => { setCodes(res.data); qc.invalidateQueries({ queryKey: ['batches'] }); },
  });

  const publishMut = useMutation({
    mutationFn: (batchId: string) => api.post(`/batches/${batchId}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });

  const openCodeDialog = async (batch: Batch) => {
    setSelectedBatch(batch);
    setCodeForm({ trace_mode: batch.trace_mode, quantity: batch.trace_mode === 'per_item' ? 100 : 1 });
    const res = await api.get(`/batches/${batch.id}/trace-codes`);
    setCodes(res.data);
    setCodeOpen(true);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">批次管理</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>新建批次</Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>批号</TableCell>
              <TableCell>商品</TableCell>
              <TableCell>赋码模式</TableCell>
              <TableCell>追溯码数</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>加载中...</TableCell></TableRow>
            ) : data?.items?.map((b: Batch) => (
              <TableRow key={b.id}>
                <TableCell>{b.batch_no}</TableCell>
                <TableCell>{b.product_name}</TableCell>
                <TableCell><Chip size="small" label={TRACE_MODE_LABEL[b.trace_mode]} /></TableCell>
                <TableCell>{b.trace_code_count}</TableCell>
                <TableCell>{b.status === 'published' ? '已发布' : b.status === 'draft' ? '草稿' : '已归档'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openCodeDialog(b)}>追溯码</Button>
                  {b.status !== 'published' && b.trace_code_count > 0 && (
                    <Button size="small" color="success" onClick={() => publishMut.mutate(b.id)}>发布</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* 新建批次 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新建批次</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>商品</InputLabel>
                <Select label="商品" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  {products?.items?.map((p: Product) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="产品批号" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>赋码模式</InputLabel>
                <Select label="赋码模式" value={form.trace_mode} onChange={(e) => setForm({ ...form, trace_mode: e.target.value as TraceMode })}>
                  <MenuItem value="per_batch">一批次一码（整批共用一个追溯码）</MenuItem>
                  <MenuItem value="per_item">一物一码（每件商品独立追溯码）</MenuItem>
                </Select>
                <FormHelperText>创建后可在生成追溯码时确认，已生成码后不可更改模式</FormHelperText>
              </FormControl>
            </Grid>
            {[
              ['planting_enterprise', '种植企业'], ['planting_contact', '种植负责人'], ['planting_phone', '种植负责人电话'],
              ['planting_base', '种植基地'], ['seed_source', '种源信息'],
              ['processing_enterprise', '加工企业'], ['processing_contact', '加工负责人'], ['processing_phone', '加工负责人电话'],
              ['processing_method', '加工工艺'], ['sales_merchant', '销售商户'],
              ['production_date', '生产日期'], ['plant_date', '种植日期'], ['harvest_date', '采收日期'],
              ['processing_date', '加工日期'], ['sales_date', '销售日期'],
            ].map(([key, label]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  type={key.includes('date') ? 'date' : 'text'}
                  slotProps={key.includes('date') ? { inputLabel: { shrink: true } } : undefined}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={!form.product_id || !form.batch_no}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 追溯码管理 */}
      <Dialog open={codeOpen} onClose={() => setCodeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>追溯码管理 - {selectedBatch?.batch_no}</DialogTitle>
        <DialogContent>
          {generateMut.isError && <Alert severity="error" sx={{ mb: 2 }}>生成失败，请检查赋码模式与数量</Alert>}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>赋码模式</InputLabel>
            <Select
              label="赋码模式"
              value={codeForm.trace_mode}
              disabled={(selectedBatch?.trace_code_count ?? 0) > 0}
              onChange={(e) => setCodeForm({ ...codeForm, trace_mode: e.target.value as TraceMode })}
            >
              <MenuItem value="per_batch">一批次一码</MenuItem>
              <MenuItem value="per_item">一物一码</MenuItem>
            </Select>
            <FormHelperText>
              {codeForm.trace_mode === 'per_batch'
                ? '整批共用一个追溯码，适合批量包装同一批次'
                : '每件商品独立追溯码，适合精细化溯源'}
            </FormHelperText>
          </FormControl>
          {codeForm.trace_mode === 'per_item' && (
            <TextField
              fullWidth
              type="number"
              label="生成数量"
              value={codeForm.quantity}
              onChange={(e) => setCodeForm({ ...codeForm, quantity: Math.max(1, Number(e.target.value)) })}
              sx={{ mb: 2 }}
              helperText="一物一码模式下，输入需要生成的追溯码数量（1-10000）"
            />
          )}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => selectedBatch && generateMut.mutate(selectedBatch.id)}
              disabled={generateMut.isPending || (codeForm.trace_mode === 'per_batch' && (selectedBatch?.trace_code_count ?? 0) > 0)}
            >
              {codeForm.trace_mode === 'per_batch' ? '生成批次追溯码' : `批量生成 ${codeForm.quantity} 个追溯码`}
            </Button>
            {codes.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => {
                  if (selectedBatch) {
                    window.open(`${api.defaults.baseURL}/export/trace-codes/${selectedBatch.id}`, '_blank');
                  }
                }}
              >
                导出追溯码
              </Button>
            )}
            {codes.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => {
                  if (selectedBatch) {
                    window.open(`${api.defaults.baseURL}/export/batch-detail/${selectedBatch.id}`, '_blank');
                  }
                }}
              >
                导出批次详情
              </Button>
            )}
          </Box>

          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>追溯码</TableCell>
                <TableCell>扫码次数</TableCell>
                <TableCell>二维码</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.scan_count}</TableCell>
                  <TableCell><QRCodeSVG value={c.qr_content} size={64} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
