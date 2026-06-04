
CREATE POLICY "Anyone can upload bid PDFs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bid-pdfs');
