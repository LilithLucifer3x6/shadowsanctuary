const fs = require('fs');
let content = fs.readFileSync('src/screens/ConjureVisage.jsx', 'utf8');
content = content.replace('export default function ConjureVisage({ onFinish }) {', 'export default function ConjureVisage({ onFinish, onCancel }) {');

const buttonSection = `
        {/* GENERATE BUTTON */}
        <button
          onClick={handleFinish}
          disabled={!isComplete}
          style={{
            width: '100%', padding: '1.1rem',
            fontSize: '1.1rem', fontWeight: 'bold',
            background: isComplete ? 'rgba(176,132,148,0.2)' : 'rgba(0,0,0,0.3)',
            border: isComplete ? '1px solid var(--plum)' : '1px solid rgba(176,132,148,0.15)',
            color: isComplete ? 'var(--plum)' : 'var(--dim)',
            borderRadius: '8px', cursor: isComplete ? 'pointer' : 'not-allowed',
            boxShadow: isComplete ? '0 0 20px rgba(176,132,148,0.2)' : 'none',
            transition: 'all 0.2s ease',
            marginBottom: onCancel ? '1rem' : '0'
          }}
        >
          {isComplete ? '✨ Bind Keeper to the Sanctuary ✨' : 'Complete all selections above to continue'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn"
            style={{ width: '100%', padding: '0.8rem', color: 'var(--dim)', border: '1px solid var(--border)', background: 'transparent' }}
          >
            Cancel (Return to Sanctuary)
          </button>
        )}
`;

content = content.replace(/\{\/\* GENERATE BUTTON \*\/\}[\s\S]*?<\/button>/, buttonSection.trim());
fs.writeFileSync('src/screens/ConjureVisage.jsx', content);
console.log('Updated ConjureVisage.jsx');
