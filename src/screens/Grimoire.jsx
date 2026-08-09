import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import { fetchTodayEvents, fetchMonthEvents } from '../lib/gcal.js';
import SpeakerButton from '../components/SpeakerButton.jsx';


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
  
  const [readingState, setReadingState] = useState(null);
  const [showScrying, setShowScrying] = useState(false);
  const [scryingMessage, setScryingMessage] = useState('');

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

    supabase.from('user_profile').select('*').maybeSingle().then(({data}) => {
      if (mounted && data) setProfile(data);
    });

    return () => { mounted = false; };
  }, []);

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
    setReadingState({ history: [], input: '', isTyping: true, completeSummary: null });
    try {
      const reply = await withHardTimeout((async () => {
        const { converseReading } = await import('../lib/ai-service.js');
        return converseReading([], profile);
      })());
      setReadingState(prev => {
        if (!prev) return null;
        return { ...prev, history: [{ role: 'assistant', text: reply }] };
      });
    } catch (err) {
      console.error("Failed to start reading:", err);
      setReadingState(prev => {
        if (!prev) return null;
        return { ...prev, history: [{ role: 'assistant', text: "The stars are obscured. I cannot commune right now." }] };
      });
    } finally {
      setReadingState(prev => prev ? { ...prev, isTyping: false } : null);
    }
  };

  const handleSendReading = async () => {
    if (!readingState || !readingState.input.trim()) return;
    const userText = readingState.input.trim();
    
    setReadingState(prev => {
      const newHist = [...prev.history, { role: 'user', text: userText }];
      return { ...prev, history: newHist, input: '', isTyping: true };
    });
    
    try {
      const currentHist = [...readingState.history, { role: 'user', text: userText }];
      const reply = await withHardTimeout((async () => {
        const { converseReading } = await import('../lib/ai-service.js');
        return converseReading(currentHist, profile);
      })()) || "";
      
      const match = reply.match(/\[READING_COMPLETE:\s*(.*?)\]/);
      // Hard cap: even with the stronger prompt instruction, don't depend
      // 100% on the model actually including the marker. If we're well past
      // a reasonable conversation length and it still didn't conclude,
      // force it client-side rather than let the reading run forever.
      const userTurnCount = currentHist.filter(h => h.role === 'user').length;
      if (match) {
        const summary = match[1];
        setReadingState(prev => ({
          ...prev, 
          completeSummary: summary,
          history: [...prev.history, { role: 'assistant', text: reply.replace(/\[READING_COMPLETE:.*?\]/, '').trim() }]
        }));
      } else if (userTurnCount >= 4) {
        setReadingState(prev => ({
          ...prev,
          completeSummary: 'Reading concluded.',
          history: [...prev.history, { role: 'assistant', text: reply }]
        }));
      } else {
        setReadingState(prev => ({
          ...prev, 
          history: [...prev.history, { role: 'assistant', text: reply }]
        }));
      }
    } catch (err) {
      console.error("Failed to send reading:", err);
      setReadingState(prev => ({
        ...prev,
        history: [...prev.history, { role: 'assistant', text: "A sudden storm clouds my vision. Try speaking your truth once more." }]
      }));
    } finally {
      setReadingState(prev => prev ? { ...prev, isTyping: false } : null);
    }
  };

  const finishReading = async () => {
    if (!readingState || !profile) return;
    try {
      const settings = profile.settings || {};
      settings.last_reading_date = new Date().toISOString();
      if (readingState.completeSummary) {
         settings.last_reading_summary = readingState.completeSummary;
      }
      await supabase.from('user_profile').update({ settings }).eq('id', profile.id);
      setProfile(prev => ({ ...prev, settings }));
      setReadingState(null);
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
        <h3>The Appointed Times <SpeakerButton text="The Appointed Times" /></h3>
        
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
          <h3>
            The Appointed Days{' '}
            <SpeakerButton text='The Appointed Days' />
          </h3>
          <div className="mt mb-4">Rites that occur sparingly.</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="row" style={{ flex: '0 1 auto', marginBottom: 0, justifyContent: 'center' }}>
                <div>
                  <div className="nm">The Root Weaving <Icon name="ph-scissors" /></div>
                  <div className="mt">
                    Every 8 weeks.{retieAppt?.date ? ` Scheduled for ${new Date(retieAppt.date).toLocaleDateString()}.` : ''}
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
                    Every 2 weeks.{nailsAppt?.date ? ` Scheduled for ${new Date(nailsAppt.date).toLocaleDateString()}.` : ''}
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
                  Offer a Visage (The Flesh Scrying)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          <div className="corner tl"></div><div className="corner tr"></div>
          <div className="corner bl"></div><div className="corner br"></div>
          <h3>
            The Weekly Wheel{' '}
            <SpeakerButton text='The Weekly Wheel' />
          </h3>
          <div className="mt mb-4">Rhythms and cycles.</div>
          
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

        <div className="card" style={{ marginTop: 0 }}>
        <div className="corner tl"></div><div className="corner tr"></div>
        <div className="corner bl"></div><div className="corner br"></div>
        <h3>
          The Ephemeris{' '}
          <SpeakerButton text='The Ephemeris' />
        </h3>
        <div className="mt mb-4">The long count.</div>
        
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
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ color: 'var(--plum)' }}>Rewrite Fate</h3>
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
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content" style={{maxWidth: '550px', background: 'transparent', border: 'none', padding: 0}}>
            <VisualInscription 
              onSkip={() => setShowScrying(false)}
              onComplete={async (data) => {
                if (data) {
                  const todayStr = new Date().toISOString().split('T')[0];
                  // Append to today's journal
                  await supabase.from('journal_entries').insert([{
                    entry_date: todayStr,
                    moon_phase: 'waxing',
                    body_text: 'Flesh Scrying: ' + data
                  }]);
                }
                setShowScrying(false);
                setScryingMessage('The Keeper has recorded your visage in the Shadow Tome.');
              }}
            />
          </div>
        </div>
      )}

      {scryingMessage && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content card" style={{maxWidth: '400px', textAlign: 'center'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <Icon name="ph-eye" style={{fontSize: '3rem', color: 'var(--plum)', marginBottom: '1rem'}} />
            <h3 style={{color: 'var(--plum)', margin: '0 0 1rem 0'}}>Visage Recorded</h3>
            <p style={{color: 'var(--dim)', marginBottom: '1.5rem'}}>{scryingMessage}</p>
            <button className="btn plum" onClick={() => setScryingMessage('')} style={{width: '100%'}}>Return</button>
          </div>
        </div>
      )}

      {readingState && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content card" style={{maxWidth: '550px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{color: 'var(--plum)', margin: 0}}>The Reading <SpeakerButton text="The Reading" /></h3>
              <button className="spk" onClick={() => setReadingState(null)} title="Abandon Reading" style={{ fontSize: '1.2rem', padding: '0.2rem' }}>
                <i className="ph-duotone ph-x"></i>
              </button>
            </div>
            <div className="mt mb-4">Reflect on the past 30 days of your rituals.</div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem', marginTop: '1rem', paddingRight: '0.5rem' }}>
              {readingState.history.map((msg, idx) => (
                <div key={idx} className={msg.role === 'assistant' ? 'msg-bot' : 'msg-user'} style={{ 
                  textAlign: msg.role === 'user' ? 'right' : 'left', 
                  marginBottom: '1rem',
                  color: msg.role === 'user' ? 'var(--text)' : 'var(--plum)'
                }}>
                  <div style={{ display: 'inline-block', background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: msg.role === 'user' ? '0.5rem 1rem' : '0', borderRadius: '8px' }}>
                    {msg.text} {msg.role === 'assistant' && <SpeakerButton text={msg.text} style={{marginLeft: '0.4rem'}} />}
                  </div>
                </div>
              ))}
              {readingState.isTyping && <div style={{ color: 'var(--dim)', fontStyle: 'italic' }}>The Keeper consults the stars...</div>}
            </div>

            {!readingState.completeSummary ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <VoiceInput 
                    isTextArea={true}
                    placeholder="Speak your truth..."
                    value={readingState.input}
                    onChange={(e) => setReadingState({...readingState, input: e.target.value})}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--plum)', fontSize: '1rem', minHeight: '60px' }}
                  />
                </div>
                <button className="btn plum" onClick={handleSendReading} disabled={readingState.isTyping || !readingState.input.trim()}>Reply</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--plum)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                  The Reading is complete. Changes noted: <br/><strong>{readingState.completeSummary}</strong>
                </div>
                <button className="btn plum" onClick={finishReading} style={{ width: '100%' }}>Consecrate The Reading</button>
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
              <button className="btn" onClick={() => setReadingState(null)}>Abandon Reading</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
