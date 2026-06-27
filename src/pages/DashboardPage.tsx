import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { api } from '../api/client';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
  });

  const cards = [
    { label: '商户数', value: data?.merchant_count ?? 0 },
    { label: '商品数', value: data?.product_count ?? 0 },
    { label: '批次数', value: data?.batch_count ?? 0 },
    { label: '追溯码数', value: data?.trace_code_count ?? 0 },
    { label: '今日扫码', value: data?.today_scan_count ?? 0 },
  ];

  return (
    <>
      <Typography variant="h5" gutterBottom>仪表盘</Typography>
      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{c.label}</Typography>
                <Typography variant="h4">{c.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
