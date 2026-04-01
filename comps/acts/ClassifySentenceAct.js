import React, { useState, useEffect } from 'react';
import styles from './ClassifySentenceAct.module.css';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseClassify(text) {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split('|').map((p) => p.trim());
    let qText = '',
      optsRaw = '';

    if (parts.length === 3) {
      qText = parts[1];
      optsRaw = parts[2];
    } else {
      qText = parts[0];
      optsRaw = parts[1] || '';
    }

    const rawOpts = optsRaw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    let correctIdx = -1;

    const cleanOpts = rawOpts.map((o, i) => {
      if (o.startsWith('*')) {
        correctIdx = i;
        return o.replace(/^\*+/, '').trim();
      }
      return o;
    });

    if (correctIdx === -1) correctIdx = 0;

    const order = shuffleArray(cleanOpts.map((_, i) => i));
    const shuffled = [];
    let newCorrect = -1;

    order.forEach((oldIdx, newIdx) => {
      shuffled.push(cleanOpts[oldIdx]);
      if (oldIdx === correctIdx) newCorrect = newIdx;
    });

    return {
      qText,
      options: shuffled,
      correctIndex: newCorrect,
      userChoice: null,
    };
  });
}

export default function ClassifySentenceAct({ data }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [status, setStatus] = useState('PLAYING');

  const title = data?.title || 'Pick the right option';

  useEffect(() => {
    if (!data) return;
    const rawText = data.text || '';
    let parsedQs = parseClassify(rawText);
    parsedQs = shuffleArray(parsedQs);
    setQuestions(parsedQs);
  }, [data]);

  const handleOptionClick = (idx) => {
    const q = questions[current];
    if (q.userChoice !== null) return;

    const isCorrect = idx === q.correctIndex;
    const updatedQuestions = [...questions];
    updatedQuestions[current] = { ...q, userChoice: idx };

    setQuestions(updatedQuestions);
    setAttempted(attempted + 1);
    if (isCorrect) setScore(score + 1);
  };

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setStatus('SUMMARY');
    }
  };

  const handleDone = () => {
    try {
      window.parent.postMessage(
        JSON.stringify({ done: true, score: score, total: attempted }),
        '*'
      );
    } catch (_) {}
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const q = questions[current];
      if (
        e.key === 'Enter' &&
        q &&
        q.userChoice !== null &&
        status === 'PLAYING'
      ) {
        handleNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  if (questions.length === 0) return null;

  const q = questions[current];
  const total = questions.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.wrap}>
          <div className={styles.title} id="actTitle">
            {title}
          </div>

          {status === 'PLAYING' ? (
            <div className={styles.card} id="cardRoot">
              {/* Wrapped in a flex container for side-by-side alignment */}
              <div className={styles.questionHeader}>
                <div className={styles.questionNum}>{current + 1})</div>
                <div
                  className={styles.qText}
                  dangerouslySetInnerHTML={{ __html: q.qText }}
                />
              </div>

              <div className={styles.optionsRow}>
                {q.options.map((opt, i) => {
                  const isSelected = q.userChoice === i;
                  const isCorrectAns = q.correctIndex === i;
                  const showTick =
                    (isSelected && isCorrectAns) ||
                    (q.userChoice !== null && isCorrectAns);
                  const showCross = isSelected && !isCorrectAns;

                  let btnClass = styles.optBtn;
                  if (q.userChoice !== null) {
                    if (isCorrectAns) btnClass += ` ${styles.selected}`;
                    else if (isSelected) btnClass += ` ${styles.wrong}`;
                  }

                  return (
                    <div
                      key={i}
                      className={btnClass}
                      onClick={() => handleOptionClick(i)}
                    >
                      {opt}
                      <span
                        className={`${styles.markIcon} ${styles.tick}`}
                        style={{ display: showTick ? 'block' : 'none' }}
                      >
                        ✓
                      </span>
                      <span
                        className={`${styles.markIcon} ${styles.cross}`}
                        style={{ display: showCross ? 'block' : 'none' }}
                      >
                        ✘
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: '18px' }}></div>

              <div className={styles.controlsRow}>
                <div className={styles.score} id="scoreBox">
                  Score: {score} / {attempted}
                </div>
                <div>
                  <button
                    className={styles.nextBtn}
                    id="nextBtn"
                    disabled={q.userChoice === null}
                    onClick={handleNext}
                  >
                    {current + 1 === total ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EXACTLY matching the summary from index.html & app.js */
            <div
              id="finalWrap"
              className={`${styles.card} ${styles.summaryCard}`}
              style={{ marginTop: '18px' }}
            >
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                You have completed this activity.
              </div>
              <div className={styles.summary} id="summaryList">
                {questions.map((sq, i) => {
                  const user =
                    sq.userChoice === null
                      ? '(no answer)'
                      : sq.options[sq.userChoice];
                  const correct = sq.options[sq.correctIndex];
                  const color =
                    sq.userChoice === sq.correctIndex ? 'green' : 'red';

                  return (
                    <div key={i} className={styles.summaryItem}>
                      <strong>{i + 1})</strong>{' '}
                      <span dangerouslySetInnerHTML={{ __html: sq.qText }} />
                      <br />
                      Answer: <span style={{ color: color }}>{user}</span>
                      <span style={{ color: '#777', marginLeft: '8px' }}>
                        — Correct: <strong>{correct}</strong>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  className={styles.small}
                  id="finalScore"
                  style={{ fontSize: '14px' }}
                >
                  Score: {score} / {attempted}
                </div>
                <button
                  className={styles.nextBtn}
                  id="doneBtn"
                  onClick={handleDone}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
