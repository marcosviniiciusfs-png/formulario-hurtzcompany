-- Banner storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('form-banners', 'form-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload banners
CREATE POLICY "Users can upload banners" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'form-banners');

-- Allow anyone to view banners (public forms need this)
CREATE POLICY "Banners are publicly viewable" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'form-banners');

-- Allow users to delete their own banners
CREATE POLICY "Users can delete banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'form-banners');
