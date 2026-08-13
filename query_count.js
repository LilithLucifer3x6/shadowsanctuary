import { supabase } from './src/lib/supabase.js';
async function count() {
  const { count, error } = await supabase.from('infusion_batches').select('*', { count: 'exact', head: true });
  if (error) console.error(error);
  console.log('Count:', count);
}
count();
