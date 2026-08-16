const fs = require('fs');
let code = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

// Replace handleBanishChatStart and handleSendBanish with a simple reason selector
const methodsAnchor = `  const handleBanishChatStart = async (name) => {`;
const methodsEnd = `  const submitBanish = async () => {`;
const newMethods = `  const submitBanish = async () => {`;

const startIdx = code.indexOf(methodsAnchor);
const endIdx = code.indexOf(methodsEnd);
if (startIdx > -1 && endIdx > -1) {
  code = code.substring(0, startIdx) + newMethods + code.substring(endIdx + newMethods.length);
}

// Fix handleBanishItem
code = code.replace(
  `  const handleBanishItem = (id, name) => {
    setBanishState({ id, name, reason: '', history: [], input: '', isTyping: false });
    handleBanishChatStart(name);
  };`,
  `  const handleBanishItem = (id, name) => {
    setBanishState({ id, name, reason: '' });
  };`
);

// Replace the modal content
const modalAnchor = `            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', marginTop: '1rem', paddingRight: '0.5rem' }}>`;
const modalEnd = `            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>`;

const mStart = code.indexOf(modalAnchor);
const mEnd = code.indexOf(modalEnd);

if (mStart > -1 && mEnd > -1) {
  const newModalContent = `            <div style={{ padding: '1rem 0' }}>
              <p style={{ color: 'var(--silver)', marginBottom: '1rem' }}>Why are you consigning this relic to the crypt?</p>
              <select 
                value={banishState.reason} 
                onChange={(e) => setBanishState({ ...banishState, reason: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '1.5rem' }}
              >
                <option value="">Select a reason...</option>
                <option value="Negative Somatic Reaction (Burning, Breakout, etc.)">Negative Somatic Reaction (Burning, Breakout, etc.)</option>
                <option value="Unpleasant Texture or Weight">Unpleasant Texture or Weight</option>
                <option value="Unpleasant Odor">Unpleasant Odor</option>
                <option value="No Observable Effect">No Observable Effect</option>
                <option value="Expired or Degraded">Expired or Degraded</option>
                <option value="Replaced by Superior Formula">Replaced by Superior Formula</option>
                <option value="Other">Other</option>
              </select>
              
              <button 
                className="btn plum" 
                onClick={submitBanish} 
                disabled={!banishState.reason}
                style={{ width: '100%' }}
              >
                Seal in the Crypt
              </button>
            </div>\n\n`;
  code = code.substring(0, mStart) + newModalContent + code.substring(mEnd);
}

fs.writeFileSync('src/screens/Rootwork.jsx', code);
console.log('Rootwork.jsx banish UI patched.');
