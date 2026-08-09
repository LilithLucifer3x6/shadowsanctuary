import React, { createContext, useContext, useState, useCallback } from 'react';

const DialogContext = createContext();

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = useCallback((type, title, message) => {
    return new Promise((resolve) => {
      setDialogs(prev => {
        // Skip if an identical dialog is already pending — prevents stacking
        // from rapid clicks before the (formerly invisible) dialog registered.
        if (prev.some(d => d.type === type && d.title === title && d.message === message)) {
          resolve(undefined);
          return prev;
        }
        const id = Date.now().toString() + Math.random().toString();
        return [...prev, { id, type, title, message, resolve }];
      });
    });
  }, []);

  const alert = useCallback((message, title = 'Notice') => {
    return showDialog('alert', title, message);
  }, [showDialog]);

  const confirm = useCallback((message, title = 'Confirm') => {
    return showDialog('confirm', title, message);
  }, [showDialog]);

  const closeDialog = (id, result) => {
    setDialogs(prev => {
      const d = prev.find(x => x.id === id);
      if (d) d.resolve(result);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialogs.map(d => (
        <div key={d.id} className="modal-backdrop" onClick={() => d.type === 'alert' ? closeDialog(d.id, true) : closeDialog(d.id, false)}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', margin: '0 auto', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ color: 'var(--plum)', marginTop: 0 }}>{d.title}</h3>
            <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>{d.message}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {d.type === 'confirm' && (
                <button className="btn" onClick={() => closeDialog(d.id, false)}>Cancel</button>
              )}
              <button className="btn plum" onClick={() => closeDialog(d.id, true)}>
                {d.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </DialogContext.Provider>
  );
}
