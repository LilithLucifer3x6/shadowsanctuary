import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { G } from '../lib/icons.jsx';

function QuizContainer({ title, children }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '1rem' }}>
      <h3 style={{ color: 'var(--plum)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon name={G.sparkles || 'sparkles'} /> {title}
      </h3>
      {children}
    </div>
  );
}

export function SkinQuiz({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const determineResult = (ans) => {
    if (ans.tight === 'yes' && ans.oil === 'none') return 'dry';
    if (ans.oil === 'everywhere') return 'oily';
    if (ans.oil === 'tzone' || (ans.tight === 'yes' && ans.oil === 'some')) return 'combo';
    return 'normal';
  };

  const handleAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < 1) {
      setStep(step + 1);
    } else {
      setResult(determineResult(newAnswers));
    }
  };

  if (result) {
    return (
      <QuizContainer title="The Bare-Faced Wash Test Complete">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>The signs reveal your vessel leans towards:</div>
          <div style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>{result}</div>
          <button className="btn plum" onClick={() => onComplete(result)}>Embrace this truth</button>
        </div>
      </QuizContainer>
    );
  }

  return (
    <QuizContainer title="The Bare-Faced Wash Test">
      {step === 0 && (
        <div>
          <p className="mb-4">Cleanse your face and wait 30 minutes without applying any products. How does it feel?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleAnswer('tight', 'yes')}>Tight and uncomfortable</button>
            <button className="btn" onClick={() => handleAnswer('tight', 'no')}>Comfortable, not tight</button>
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <p className="mb-4">After those 30 minutes, where do you see or feel oil?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleAnswer('oil', 'none')}>Nowhere</button>
            <button className="btn" onClick={() => handleAnswer('oil', 'tzone')}>Only on my nose and forehead (T-Zone)</button>
            <button className="btn" onClick={() => handleAnswer('oil', 'everywhere')}>Everywhere, I look shiny</button>
          </div>
        </div>
      )}
    </QuizContainer>
  );
}

export function ScalpQuiz({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const determineResult = (ans) => {
    if (ans.itch === 'yes' || ans.flakes === 'yes') return 'sensitive';
    if (ans.wash === 'daily') return 'oily';
    if (ans.wash === 'rarely') return 'dry';
    return 'balanced';
  };

  const handleAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < 2) {
      setStep(step + 1);
    } else {
      setResult(determineResult(newAnswers));
    }
  };

  if (result) {
    return (
      <QuizContainer title="The Root Divination Complete">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>The signs reveal your roots lean towards:</div>
          <div style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>{result}</div>
          <button className="btn plum" onClick={() => onComplete(result)}>Embrace this truth</button>
        </div>
      </QuizContainer>
    );
  }

  return (
    <QuizContainer title="The Root Divination">
      {step === 0 && (
        <div>
          <p className="mb-4">How soon after washing does your hair begin to feel weighed down or greasy at the root?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleAnswer('wash', 'daily')}>By the end of the first day</button>
            <button className="btn" onClick={() => handleAnswer('wash', 'normal')}>2-3 days</button>
            <button className="btn" onClick={() => handleAnswer('wash', 'rarely')}>More than 4 days, it rarely gets greasy</button>
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <p className="mb-4">Do you often experience an itchy or tender scalp?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleAnswer('itch', 'yes')}>Yes, frequently</button>
            <button className="btn" onClick={() => handleAnswer('itch', 'no')}>No, rarely</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <p className="mb-4">If you experience flakes, how would you describe them?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleAnswer('flakes', 'yes')}>Yellowish or oily flakes</button>
            <button className="btn" onClick={() => handleAnswer('flakes', 'no')}>Small dry white flakes, or none at all</button>
          </div>
        </div>
      )}
    </QuizContainer>
  );
}

export function PorosityQuiz({ onComplete }) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  const handleResult = (res) => {
    setResult(res);
  };

  if (result) {
    return (
      <QuizContainer title="The Water Float Test Complete">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Your strands reveal their true nature:</div>
          <div style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>{result}</div>
          <button className="btn plum" onClick={() => onComplete(result)}>Embrace this truth</button>
        </div>
      </QuizContainer>
    );
  }

  return (
    <QuizContainer title="The Water Float Test">
      {step === 0 && (
        <div>
          <p className="mb-4">Take a single clean, product-free strand of hair and drop it into a glass of room-temperature water. Wait 2-4 minutes. What happens?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => handleResult('low')}>It floats on the top</button>
            <button className="btn" onClick={() => handleResult('medium')}>It slowly sinks or hovers in the middle</button>
            <button className="btn" onClick={() => handleResult('high')}>It sinks straight to the bottom</button>
          </div>
        </div>
      )}
    </QuizContainer>
  );
}
