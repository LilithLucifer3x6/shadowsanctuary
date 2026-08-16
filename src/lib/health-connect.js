import { Capacitor } from '@capacitor/core';

// @capgo/capacitor-health is a native-only plugin. Dynamic import guarded
// by isNativePlatform() so it is never resolved on web — not installed in
// web package.json and listed in rollupOptions.external in vite.config.js.
async function getHealth() {
  if (!Capacitor.isNativePlatform()) return null;
  const { Health } = await import('@capgo/capacitor-health');
  return Health;
}

/**
 * Health Connect Broker
 * Integrates Android Health Connect via Capacitor native plugins, falling back to snapshots on Web.
 */

// Helper to prevent native plugins from hanging the app indefinitely
const withTimeout = (promise, ms = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Health Connect query timed out')), ms))
  ]);
};

export async function requestHealthPermissions() {
  const Health = await getHealth();
  if (Health) {
    try {
      await Health.requestAuthorization({
        read: ['sleepAnalysis', 'heartRate', 'activeEnergyBurned', 'workouts']
      });
      return true;
    } catch (e) {
      console.error('Failed to request health permissions:', e);
      return false;
    }
  }
  return true;
}

let cachedSnapshot = undefined;

async function fetchLatestSnapshot() {
  if (cachedSnapshot !== undefined) return cachedSnapshot;
  try {
    const { supabase } = await import('./supabase.js');
    const { data } = await supabase
      .from('wearable_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    cachedSnapshot = data || null;
  } catch(e) {
    console.error('Failed to fetch snapshot:', e);
    cachedSnapshot = null;
  }
  return cachedSnapshot;
}

export async function syncWearableSnapshot() {
  if (!Capacitor.isNativePlatform()) return;
  const readiness = await getReadiness();
  const heavySweat = await getHeavySweat();
  const sleepDuration = await getSleepDuration();
  
  try {
    const { supabase } = await import('./supabase.js');
    await supabase.from('wearable_snapshots').insert([{
      readiness_score: readiness.score,
      readiness_state: readiness.state,
      heavy_sweat: heavySweat,
      sleep_duration: parseFloat(sleepDuration)
    }]);
  } catch (e) {
    console.error('Failed to sync wearable snapshot:', e);
  }
}

export async function getReadiness() {
  const Health = await getHealth();
  if (Health) {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
      
      const hrData = await withTimeout(Health.query({
        sampleType: 'heartRate',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }));

      const sleepDurationHours = parseFloat(await getSleepDuration());
      let score = 50; 
      
      const sleepScore = Math.min(30, (sleepDurationHours / 8) * 30);
      score += sleepScore;
      
      let rhr = 70; 
      if (hrData && hrData.samples && hrData.samples.length > 0) {
        const validHr = hrData.samples
          .map(s => typeof s.value === 'number' ? s.value : (s.value?.count || 70))
          .filter(v => v > 30 && v < 150); 
          
        if (validHr.length > 0) {
          validHr.sort((a, b) => a - b);
          rhr = validHr[Math.floor(validHr.length * 0.05)]; 
        }
      }
      
      if (rhr < 60) score += 20;       
      else if (rhr < 70) score += 15;  
      else if (rhr < 80) score += 5;   

      score = Math.min(100, Math.round(score));
      
      let state = 'optimal';
      if (score < 60) state = 'drained';
      else if (score < 80) state = 'fair';
      
      return { score, state };
    } catch (e) {
      console.error('Health Connect query error:', e);
      // Fall through to snapshot
    }
  }
  
  const snap = await fetchLatestSnapshot();
  if (snap) {
    return { score: snap.readiness_score, state: snap.readiness_state, captured_at: snap.captured_at };
  }
  return null;
}

export async function getHeavySweat() {
  const Health = await getHealth();
  if (Health) {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
      const workoutData = await withTimeout(Health.query({
        sampleType: 'workouts',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }));
      return workoutData && workoutData.samples && workoutData.samples.length > 0;
    } catch (e) {
      console.error('Health Connect query error:', e);
      // Fall through to snapshot
    }
  }
  
  const snap = await fetchLatestSnapshot();
  return snap ? snap.heavy_sweat : false;
}

export async function getSleepDuration() {
  const Health = await getHealth();
  if (Health) {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
      const sleepData = await withTimeout(Health.query({
        sampleType: 'sleepAnalysis',
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }));
      if (sleepData && sleepData.samples && sleepData.samples.length > 0) {
        const totalMs = sleepData.samples.reduce((acc, sample) => {
          return acc + (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime());
        }, 0);
        return (totalMs / (1000 * 60 * 60)).toFixed(1);
      }
    } catch (e) {
      console.error('Health Connect query error:', e);
      // Fall through to snapshot
    }
  }
  
  const snap = await fetchLatestSnapshot();
  return snap ? snap.sleep_duration : 7.5;
}
