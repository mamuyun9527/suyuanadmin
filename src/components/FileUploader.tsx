import { useState } from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { api } from '../api/client';

interface FileUploaderProps {
  type: 'image' | 'document';
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
}

export default function FileUploader({ type, onUpload, label = '上传文件', accept }: FileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpload(data.url);
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept={accept || (type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx')}
        onChange={handleChange}
        style={{ display: 'none' }}
        id={`upload-${type}`}
      />
      <label htmlFor={`upload-${type}`}>
        <Button variant="contained" component="span" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : label}
        </Button>
      </label>
      {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  );
}