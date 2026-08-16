import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import { fetchTodayEvents, fetchMonthEvents } from '../lib/gcal.js';
import SpeakerButton from '../components/SpeakerButton.jsx';
import TheReadingQuiz from '../components/TheReadingQuiz.jsx';

import VoiceInput from '../components/VoiceInput.jsx';
import VisualInscription from '../components/VisualInscription.jsx';

export default function Grimoire({ pose }) {
  const [appointments, setAppointments] = useState([]);
  const [marked, setMarked] = useState({});
  const [history, setHistory] = useState([]);
  const [realEvents, setRealEvents] = useState([]);
  const [monthEvents, setMonthEvents] = useState([]);

  const [profile, setProfile] = useState(null);
  const [overrideModal, setOverrideModal] = useState({ show: false, type: '', date: '' });
  const [isoLogs, setIsoLogs] = useState([]);
  
  const [showReadingQuiz, setShowReadingQuiz] = useState(false);
  const [readingContext, setReadingContext] = useState({ reactions: [], banished: [], waning: [] });
  
  const [showScrying, setShowScrying] = useState(false);
  const [scryingMessage, setScryingMessage] = useState('');
  
  const [showWashModal, setShowWashModal] = useState(false);
  const [washForm, setWashForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    notes: '', 
    likenesses: [], 
    usedItemIds: [],
    blotTestResult: '',
    scratchTestResult: ''
  });
  const [availableWashItems, setAvailableWashItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    // The appointments table (name, cadence_weeks, last_completed, next_due)
    // was already correctly designed for local scheduling, but nothing ever
    // actually read from it — the app only ever tried Google Calendar sync,
    // which silently does nothing without a connected provider token. This
    // is the real, reliable source; Google sync stays available separately
    // for realEvents/monthEvents, but Root Weaving / Gilded Hand scheduling
    // no longer depends on it.
    supabase.from('appointments').select('*').then(({ data }) => {
      if (mounted && data) {
        const mapped = data.map(row => ({
          ...row,
          type: (row.name === 'The Root Weaving' || row.name === 'Root Weaving') ? 'retie' : (row.name === 'The Gilded Hand' || row.name === 'Talon Honing') ? 'nails' : null,
          date: row.next_due
        }));
        setAppointments(mapped);
      }
    });

    supabase.from('routine_history').select('*').order('completed_at', { ascending: false }).limit(30)
      .then(({data}) => {
        if (mounted && data) setHistory(data);
      });
      
    supabase.from('isotretinoin_log').select('*').order('last_confirmed_date', { ascending: false })
      .then(({data}) => {
        if (mounted && data) {
          setIsoLogs(data);
        }
      });
      
    fetchTodayEvents().then(events => {
      if (mounted) setRealEvents(events);
    });
    
    const currDate = new Date();
    fetchMonthEvents(currDate.getFullYear(), currDate.getMonth()).then(events => {
      if (mounted) setMonthEvents(events);
    });

    if (window.location.search.includes('test_grim=1')) {
      setProfile({ id: 'mock-user' });
    } else {
      supabase.from('user_profile').select('*').maybeSingle().then(({data}) => {
        if (mounted && data) setProfile(data);
      });
    }

    supabase.from('items').select('id, name, brand, category').in('lifecycle_state', ['stocked', 'ebbing']).then(({data}) => {
      if (mounted && data) {
        const washItems = data.filter(i => {
           const c = (i.category || '').toLowerCase();
           return c.includes('wash') || c.includes('shampoo') || c.includes('conditioner') || c.includes('cleanser');
        });
        setAvailableWashItems(washItems);
      }
    });

    return () => { mounted = false; };
  }, [profile?.id]);

  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

  const markDone = async (type) => {
    const appt = appointments.find(a => a.type === type);
    if (!appt) return;


    const today = new Date();
    const cadenceWeeks = appt.cadence_weeks || (type === 'retie' ? 8 : 2);
    const nextDue = new Date(today.getTime() + cadenceWeeks * 7 * 86400000);
    const todayStr = today.toISOString().split('T')[0];
    const nextDueStr = nextDue.toISOString().split('T')[0];

    const { error } = await supabase.from('appointments').update({
      last_completed: todayStr,
      next_due: nextDueStr,
      updated_at: new Date().toISOString()
    }).eq('id', appt.id);

    if (error) {
      console.error('Failed to update appointment:', error);
      return;
    }


    setAppointments(prev => prev.map(a =>
      a.id === appt.id ? { ...a, last_completed: todayStr, next_due: nextDueStr, date: nextDueStr } : a
    ));
    setMarked(prev => ({ ...prev, [type]: true }));


  };

  const handleOverride = (type) => {
    setOverrideModal({ show: true, type, date: new Date().toISOString().split('T')[0] });
  };

  const handleOverrideSubmit = async () => {
    if (!overrideModal.date || !profile) return;
    try {
      const settings = profile.settings || {};
      const apptOverrides = settings.appointment_overrides || {};
      apptOverrides[overrideModal.type] = overrideModal.date;
      
      const newSettings = { ...settings, appointment_overrides: apptOverrides };
      await supabase.from('user_profile').update({ settings: newSettings }).eq('id', profile.id);
      
      setProfile(prev => ({ ...prev, settings: newSettings }));
      setAppointments(prev => prev.map(a => a.type === overrideModal.type ? { ...a, date: overrideModal.date } : a));
      setOverrideModal({ show: false, type: '', date: '' });
    } catch(e) {
      console.error(e);
    }
  };

  // Hard client-side failsafe: guarantees this never hangs forever in the UI,
  // even if the underlying Supabase call's own abort/retry logic fails to
  // actually settle (e.g. a signal that doesn't propagate, a cold-start hang).
  const withHardTimeout = (promise, ms = 50000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out waiting for a response.')), ms)
      )
    ]);
  };

  const handleStartReading = async () => {
    try {
      const { data: reactions } = await supabase.from('somatic_reactions').select('*, items(name, brand)').order('created_at', { ascending: false }).limit(5);
      const { data: items } = await supabase.from('items').select('name, category, lifecycle_state');
      const banished = (items || []).filter(i => i.lifecycle_state === 'banished').map(i => i.name);
      const waning = (items || []).filter(i => i.lifecycle_state === 'waning' || i.lifecycle_state === 'ebbing').map(i => i.name);
      
      setReadingContext({ reactions: reactions || [], banished, waning });
      setShowReadingQuiz(true);
    } catch (err) {
      console.error("Failed to start reading:", err);
    }
  };

  const handleWashImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(f => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
    })).then(base64s => {
      setWashForm(prev => ({
        ...prev,
        likenesses: [...prev.likenesses, ...base64s]
      }));
    }).catch(console.error);
  };

  const handleSaveWash = async () => {
    try {
      if (!profile) return;
      await supabase.from('wash_day_log').insert([{
        user_id: profile.id,
        entry_date: washForm.date,
        moon_phase: 'waxing',
        notes: washForm.notes,
        likenesses: washForm.likenesses,
        used_item_ids: washForm.usedItemIds.length > 0 ? washForm.usedItemIds : null,
        blot_test_result: washForm.blotTestResult || null,
        scratch_test_result: washForm.scratchTestResult || null
      }]);

      if (washForm.blotTestResult) {
        // Inform user_profile.scalp_condition based on blot test
        const newSettings = { ...(profile.settings || {}) };
        const newIntake = { ...(profile.intake_answers || {}) };
        
        // Example mapping logic for blot test to scalp condition
        let inferredScalp = '';
        if (washForm.blotTestResult === 'heavy_oil') inferredScalp = 'Oily';
        else if (washForm.blotTestResult === 'light_oil') inferredScalp = 'Balanced';
        else if (washForm.blotTestResult === 'no_oil_flakes') inferredScalp = 'Dry/Flaky';
        else if (washForm.blotTestResult === 'no_oil_clean') inferredScalp = 'Dry';

        if (inferredScalp) {
          // You could also save this into a dedicated "scalp_condition" column if it exists,
          // but for now, store in intake_answers as a dynamic update
          newIntake.inferredScalpCondition = inferredScalp;
          await supabase.from('user_profile').update({ intake_answers: newIntake }).eq('id', profile.id);
          setProfile(prev => ({ ...prev, intake_answers: newIntake }));
        }
      }

      setShowWashModal(false);
      setWashForm({ date: new Date().toISOString().split('T')[0], notes: '', likenesses: [], usedItemIds: [], blotTestResult: '', scratchTestResult: '' });
      setScryingMessage('The Keeper has recorded your wash day.');
    } catch(err) {
      console.error(err);
      alert('Failed to save wash day.');
    }
  };



  const finishReading = async (answers) => {
    if (!profile) return;
    try {
      const summaryParts = [];
      if (answers.shiftInForm !== 'No Change') summaryParts.push(`Shift in Form: ${answers.shiftInForm}`);
      if (answers.emergingShadows.length > 0) summaryParts.push(`New Concerns: ${answers.emergingShadows.join(', ')}`);
      if (answers.textureTouch.length > 0) summaryParts.push(`Texture Needs: ${answers.textureTouch.join(', ')}`);
      if (answers.rhythms.length > 0) summaryParts.push(`Lifestyle Rhythms: ${answers.rhythms.join(', ')}`);
      
      const summary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'No changes noted.';

      const settings = profile.settings || {};
      settings.last_reading_date = new Date().toISOString();
      settings.last_reading_summary = summary;
      
      await supabase.from('user_profile').update({ settings }).eq('id', profile.id);
      setProfile(prev => ({ ...prev, settings }));
      setShowReadingQuiz(false);
    } catch (e) {
      console.error(e);
    }
  };

  const overrides = profile?.settings?.appointment_overrides || {};
  let retieAppt = appointments.find(a => a.type === 'retie');
  if (retieAppt && overrides['retie']) retieAppt = { ...retieAppt, date: overrides['retie'] };
  
  let nailsAppt = appointments.find(a => a.type === 'nails');
  if (nailsAppt && overrides['nails']) nailsAppt = { ...nailsAppt, date: overrides['nails'] };

  const prevMonthDays = new Date(year, month, 0).getDate();
  const emptyDays = [];
  for (let i = 0; i < firstDay; i++) {
    emptyDays.push(
      <div key={`empty-${i}`} className="cd" style={{ opacity: 0.3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{prevMonthDays - firstDay + i + 1}</span>
        </div>
      </div>
    );
  }

  const calDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === d.getDate() ? 'today' : '';
    const hasRetie = retieAppt && retieAppt.date && new Date(retieAppt.date).getDate() === i && new Date(retieAppt.date).getMonth() === month && new Date(retieAppt.date).getFullYear() === year;
    const hasNails = nailsAppt && nailsAppt.date && new Date(nailsAppt.date).getDate() === i && new Date(nailsAppt.date).getMonth() === month && new Date(nailsAppt.date).getFullYear() === year;
    
    const currentDayTime = new Date(year, month, i).getTime();
    const dayOfWeek = new Date(year, month, i).getDay();
    
    const orals = profile?.intake_answers?.oralList || [];
    const rxs = profile?.intake_answers?.rxList || [];
    const allMeds = [...orals, ...rxs].map(m => (m.name || '').toLowerCase());
    
    const hasIsotretinoin = allMeds.some(m => m.includes('isotretinoin') || m.includes('accutane'));
    const hasFridayInjections = dayOfWeek === 5 && allMeds.some(m => m.includes('enbrel') || m.includes('wegovy') || m.includes('methotrexate') || m.includes('etanercept'));
    
    let isoDisplay = null;
    if (hasIsotretinoin) {
      const calDate = new Date(year, month, i);
      const calDateString = calDate.getFullYear() + '-' + String(calDate.getMonth() + 1).padStart(2, '0') + '-' + String(calDate.getDate()).padStart(2, '0');
      
      const todayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const todayString = todayDate.getFullYear() + '-' + String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + String(todayDate.getDate()).padStart(2, '0');
      
      if (calDate.getTime() <= todayDate.getTime()) {
         const logForDay = isoLogs.find(l => (l.last_confirmed_date || '').startsWith(calDateString));
         if (logForDay) {
           isoDisplay = logForDay.last_confirmed_dose_mg === 0 ? 'Missed' : `${logForDay.last_confirmed_dose_mg}mg`;
         } else if (calDateString === todayString) {
           const lastTaken = isoLogs.find(l => l.last_confirmed_dose_mg > 0);
           isoDisplay = lastTaken ? (lastTaken.last_confirmed_dose_mg === 40 ? '80mg' : '40mg') : '40mg';
         }
      } else {
         const lastTaken = isoLogs.find(l => l.last_confirmed_dose_mg > 0);
         const baseDose = lastTaken ? lastTaken.last_confirmed_dose_mg : 80;
         const todaysExpectedDose = baseDose === 40 ? 80 : 40;
         
         const logToday = isoLogs.find(l => (l.last_confirmed_date || '').startsWith(todayString));
         let actualTodaysExpected;
         if (logToday && logToday.last_confirmed_dose_mg > 0) {
             actualTodaysExpected = logToday.last_confirmed_dose_mg;
         } else {
             actualTodaysExpected = todaysExpectedDose;
         }
         
         const diffFutureDays = Math.round((calDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
         isoDisplay = (diffFutureDays % 2 === 1) ? (actualTodaysExpected === 40 ? '80mg' : '40mg') : (actualTodaysExpected === 40 ? '40mg' : '80mg');
      }
    }

    const dayEvents = monthEvents.filter(ev => {
      if (!ev.start) return false;
      const evDate = new Date(ev.start.dateTime || ev.start.date);
      // Ensure the event falls on this exact day of this month/year
      return evDate.getDate() === i && evDate.getMonth() === month && evDate.getFullYear() === year;
    });

    calDays.push(
      <div key={`day-${i}`} className={`cd ${isToday}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{i}</span>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {hasRetie && <span title="The Root Weaving" style={{ color: 'var(--plum)' }}><Icon name="ph-scissors" /></span>}
            {hasNails && <span title="The Gilded Hand" style={{ color: 'var(--plum)' }}><Icon name="ph-hand-palm" /></span>}
          </div>
        </div>
        
        {dayEvents.length > 0 && (
          <div style={{ marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            {dayEvents.map((ev, idx) => (
              <div key={idx} style={{ 
                fontSize: '0.65rem', 
                background: 'var(--plum-b)', 
                color: 'var(--plum)', 
                padding: '2px 4px', 
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                }}>
                {new Date(ev.start.dateTime || ev.start.date).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {ev.summary}
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {allMeds.map((m, i) => {
              const l = m.toLowerCase();
              if (l.includes('isotretinoin') || l.includes('accutane')) return (
                <div key={i} className="pill" style={{ color: 'var(--plum)', borderColor: 'var(--border)' }}>
                  {m} {isoDisplay || ''}
                </div>
              );
              if (dayOfWeek === 5 && (l.includes('methotrexate') || l.includes('wegovy') || l.includes('enbrel') || l.includes('etanercept'))) return (
                <div key={i} className="pill" style={{ color: 'var(--plum)', borderColor: 'var(--plum)' }}>
                  {m} (Weekly Injection)
                </div>
              );
              return null;
            })}
        </div>
      </div>
    );
  }

  const wheelDays = [
    { name: 'Mon', num: 1 }, { name: 'Tue', num: 2 }, { name: 'Wed', num: 3 }, 
    { name: 'Thu', num: 4 }, { name: 'Fri', num: 5 }, { name: 'Sat', num: 6 }, { name: 'Sun', num: 0 }
  ];

  return (
    <div style={{ padding: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="grim-grid mt-2">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ marginTop: 0 }}>
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="ph-clock" /> The Appointed Times{' '}
          <Icon name="ph-calendar" />{' '}
          <SpeakerButton text="The Appointed Times" />
        </h3>
        
        {realEvents.length > 0 ? realEvents.map((ev, i) => (
          <div key={i} className="step">
            <div className="body">
              <div className="nm">{ev.summary}</div>
              <div className="mt">{new Date(ev.start.dateTime || ev.start.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>
        )) : (
          <div className="step">
            <div className="body">
              <div className="nm">No mortal omens foretold for today.</div>
              <div className="mt">Your day is your own.</div>
            </div>
          </div>
        )}
      </div>

        <div className="card mt-4" style={{ alignSelf: 'flex-start' }}>
          <div className="corner tl"></div><div className="corner tr"></div>
          <div className="corner bl"></div><div className="corner br"></div>
          <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="ph-calendar" /> The Appointed Days{' '}
            <Icon name="ph-calendar-star" />{' '}
            <SpeakerButton text='The Appointed Days' />
          </h3>
          <div className="mt mb-4">Rites that occur sparingly.</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="row" style={{ flex: '0 1 auto', marginBottom: 0, justifyContent: 'center' }}>
                <div>
                  <div className="nm">The Root Weaving <Icon name="ph-scissors" /></div>
                  <div className="mt">
                    Every 8 cycles.{retieAppt?.date ? ` Scheduled for ${new Date(retieAppt.date).toLocaleDateString()}.` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn sm plum btn-appt" 
                  onClick={() => markDone('retie')}
                  style={{ opacity: marked['retie'] ? 0.5 : 1 }}
                >
                  {marked['retie'] ? 'Consecrated' : 'Consecrate'}
                </button>
                <button className="spk btn-override" title="Override Calendar Fate" onClick={() => handleOverride('retie')}>
                  <i className="ph-duotone ph-dots-three-vertical"></i>
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="row" style={{ flex: '0 1 auto', marginBottom: 0, justifyContent: 'center' }}>
                <div>
                  <div className="nm">The Gilded Hand <Icon name="ph-hand-palm" /></div>
                  <div className="mt">
                    Every 2 cycles.{nailsAppt?.date ? ` Scheduled for ${new Date(nailsAppt.date).toLocaleDateString()}.` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn sm plum btn-appt" 
                  onClick={() => markDone('nails')}
                  style={{ opacity: marked['nails'] ? 0.5 : 1 }}
                >
                  {marked['nails'] ? 'Consecrated' : 'Consecrate'}
                </button>
                <button className="spk btn-override" title="Override Calendar Fate" onClick={() => handleOverride('nails')}>
                  <i className="ph-duotone ph-dots-three-vertical"></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px dashed var(--border)', paddingTop: '1rem', width: '100%' }}>
              <div className="row" style={{ flex: '1', marginBottom: 0, border: 'none', background: 'transparent', justifyContent: 'center' }}>
                <div>
                  <div className="nm">The Reading <Icon name="ph-moon-stars" /></div>
                  <div className="mt">
                    A 30-day reflection to realign your regimens.
                    {profile?.settings?.last_reading_date && <><br/>Last Communion: {new Date(profile.settings.last_reading_date).toLocaleDateString()}</>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    className="btn plum" 
                    onClick={handleStartReading}
                  >
                    Commune
                </button>
                <button 
                  className="btn" 
                  onClick={() => setShowScrying(true)}
                  style={{ background: 'var(--card2)', color: 'var(--plum)', borderColor: 'var(--plum)' }}
                >
                  <Icon name="ph-camera" weight="duotone" size={20} />
                  Offer a Testament
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px dashed var(--border)', paddingTop: '1rem', width: '100%' }}>
              <div className="row" style={{ flex: '1', marginBottom: 0, border: 'none', background: 'transparent', justifyContent: 'center' }}>
                <div>
                  <div className="nm">Wash-Day Ledger <Icon name="ph-drop" /></div>
                  <div className="mt">Chronicle the cleansing of your crown.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn plum" 
                  onClick={() => setShowWashModal(true)}
                >
                  Log Wash Day
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="corner tl"></div><div className="corner tr"></div>
          <div className="corner bl"></div><div className="corner br"></div>
          <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="ph-arrows-clockwise" /> The Weekly Wheel{' '}
            <Icon name="ph-arrows-clockwise" />{' '}
            <SpeakerButton text='The Weekly Wheel' />
          </h3>
          <div className="mb-2" style={{ marginTop: '-0.2rem', textAlign: 'center' }}>Rhythms and cycles.</div>
          
          <div className="wheel-container">
            <div className="wheel">
              {wheelDays.map(day => {
                const isFriday = day.num === 5;
                const orals = profile?.intake_answers?.oralList || [];
                const rxs = profile?.intake_answers?.rxList || [];
                const allMeds = [...orals, ...rxs].map(m => (m.name || '').toLowerCase());
                
                const hasDrysol = allMeds.some(m => m.includes('drysol'));
                
                return (
                  <div key={day.name} className="d">
                    <div className="dn">{day.name}</div>
                    <div className="tg" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                        {allMeds.map((m, i) => {
                          const l = m.toLowerCase();
                          if (l.includes('isotretinoin') || l.includes('accutane')) {
                            return <span key={i} className="pill" style={{ color: 'var(--plum)' }}>{m} A/B Alternating</span>;
                          }
                          if (isFriday && (l.includes('methotrexate') || l.includes('wegovy') || l.includes('enbrel') || l.includes('etanercept'))) {
                            return <span key={i} className="pill" style={{ color: 'var(--plum)', borderColor: 'var(--plum)' }}>{m}</span>;
                          }
                          return null;
                        })}
                      {hasDrysol && (
                        <span className="pill" style={{ color: 'var(--plum)', borderColor: 'var(--plum)' }}>Drysol (Nightly)</span>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="corner tl"></div><div className="corner tr"></div>
        <div className="corner bl"></div><div className="corner br"></div>
          <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="ph-moon-stars" /> The Ephemeris{' '}
            <Icon name="ph-planet" />{' '}
            <SpeakerButton text='The Ephemeris' />
          </h3>
        <div className="mb-2" style={{ marginTop: '-0.2rem', textAlign: 'center' }}>The long count.</div>
        
        <h2 style={{ fontSize: '2.5rem', color: 'var(--plum)', textAlign: 'center', margin: '1rem 0' }}>
          {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        
        <div className="cal">
          <div className="ch">S</div><div className="ch">M</div><div className="ch">T</div>
          <div className="ch">W</div><div className="ch">T</div><div className="ch">F</div>
          <div className="ch">S</div>
          {emptyDays}
          {calDays}
        </div>
      </div>

      </div>
      </div>
      
      {overrideModal.show && (
        <div className="modal">
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Icon name="ph-pencil-simple" /> Rewrite Fate</h3>
            <div className="mt mb-4" style={{ color: 'var(--plum)' }}>
              Name the date this rite was last fulfilled.
            </div>
            <input 
              type="date" 
              value={overrideModal.date} 
              onChange={e => setOverrideModal({ ...overrideModal, date: e.target.value })} 
              style={{ width: '100%', padding: '0.8rem', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px', marginBottom: '1rem' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setOverrideModal({ show: false, type: '', date: '' })}>Abandon</button>
              <button className="btn plum" onClick={handleOverrideSubmit}>Rewrite</button>
            </div>
          </div>
        </div>
      )}

      {showScrying && (
        <div className="modal">
          <div className="modal-content" style={{maxWidth: '550px', background: 'transparent', border: 'none', padding: 0}}>
            <VisualInscription 
              onSkip={() => setShowScrying(false)}
              onComplete={async (data, photoPreview) => {
                if (data) {
                  const todayStr = new Date().toISOString().split('T')[0];
                  // Append to testament_log
                  await supabase.from('testament_log').insert([{
                    user_id: profile.id,
                    image_url: photoPreview,
                    notes: 'Testament Recorded: ' + data
                  }]);
                }
                setShowScrying(false);
                setScryingMessage('The Keeper has recorded your testament in your Records.');
              }}
            />
          </div>
        </div>
      )}

      {scryingMessage && (
        <div className="modal">
          <div className="modal-content" style={{maxWidth: '450px'}}>
            <div className="card">
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{color: 'var(--plum)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'}}><Icon name="ph-check-circle" /> The Testament Recorded</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>{scryingMessage}</div>
            <button className="btn plum" onClick={() => setScryingMessage('')} style={{width: '100%'}}>Return</button>
            </div>
          </div>
        </div>
      )}

      {showReadingQuiz && (
        <TheReadingQuiz 
          profile={profile}
          contextData={readingContext}
          onComplete={finishReading}
          onAbandon={() => setShowReadingQuiz(false)}
        />
      )}

      {showWashModal && (
        <div className="modal">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Icon name="ph-bathtub" /> Wash-Day Ledger <SpeakerButton text="Wash Day Ledger" /></h3>
            <div className="mt mb-4" style={{ color: 'var(--dim)' }}>Record the cleansing of your crown. Add reflections and visual evidence of your regimen's outcome.</div>
            
            <div className="field">
              <label>The Date of Cleansing</label>
              <input 
                type="date" 
                value={washForm.date} 
                onChange={e => setWashForm({ ...washForm, date: e.target.value })} 
                style={{ width: '100%', padding: '0.8rem', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} 
              />
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Inventory Used</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {availableWashItems.length > 0 ? availableWashItems.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)' }}>
                    <input 
                      type="checkbox" 
                      checked={washForm.usedItemIds.includes(item.id)}
                      onChange={(e) => {
                        setWashForm(prev => {
                          const newIds = e.target.checked 
                            ? [...prev.usedItemIds, item.id] 
                            : prev.usedItemIds.filter(id => id !== item.id);
                          return { ...prev, usedItemIds: newIds };
                        });
                      }}
                    />
                    {item.brand ? `${item.brand} ` : ''}{item.name} <span style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>({item.category})</span>
                  </label>
                )) : (
                  <div style={{ color: 'var(--dim)' }}>No wash items found in active inventory.</div>
                )}
              </div>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Blot Test Result</label>
              <select 
                value={washForm.blotTestResult} 
                onChange={e => setWashForm({ ...washForm, blotTestResult: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }}
              >
                <option value="">-- Select Blot Test Result --</option>
                <option value="heavy_oil">Heavy Oil (Saturated)</option>
                <option value="light_oil">Light Oil (Translucent Spots)</option>
                <option value="no_oil_clean">No Oil (Clean paper)</option>
                <option value="no_oil_flakes">No Oil (Dry flakes visible)</option>
              </select>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Scratch Test Result</label>
              <select 
                value={washForm.scratchTestResult} 
                onChange={e => setWashForm({ ...washForm, scratchTestResult: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }}
              >
                <option value="">-- Select Scratch Test Result --</option>
                <option value="white_waxy">White waxy buildup</option>
                <option value="dry_flakes">Dry white flakes (snow-like)</option>
                <option value="yellow_flakes">Yellowish greasy flakes</option>
                <option value="clean">Clean (No residue under nails)</option>
              </select>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Reflections & Notes (Optional)</label>
              <textarea 
                value={washForm.notes} 
                onChange={e => setWashForm({ ...washForm, notes: e.target.value })} 
                placeholder="Describe product reactions, sensations, or other observations..."
                style={{ width: '100%', padding: '0.8rem', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px', minHeight: '80px' }} 
              />
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Likenesses (Optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="file" multiple accept="image/*" onChange={handleWashImageUpload} style={{ background: 'var(--surface)', color: 'var(--silver)' }} />
                {washForm.likenesses && washForm.likenesses.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {washForm.likenesses.map((src, idx) => (
                      <img key={idx} src={src} alt="Wash likeness" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn" onClick={() => setShowWashModal(false)}>Abandon</button>
              <button className="btn plum" onClick={handleSaveWash} disabled={!washForm.date || (washForm.usedItemIds.length === 0 && !washForm.blotTestResult && !washForm.scratchTestResult && !washForm.notes.trim() && washForm.likenesses.length === 0)}>
                Commit to Ledger
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
