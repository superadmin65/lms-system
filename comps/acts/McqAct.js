// comps/acts/McqAct.js
import React, { useState, useEffect } from 'react';
import styles from './McqAct.module.css';
import { apiService } from '../../utils/apiService';

function parseOptionsString(raw) {
  return (raw || '')
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeQuestions(raw) {
  return raw.map((q) => {
    const original = q.qText || q.text || '';
    const rawOpts = parseOptionsString(q.options || q.option || '');
    let originalCorrectIndex = -1;

    const cleanedOpts = rawOpts.map((opt, idx) => {
      if (opt.includes('*')) {
        originalCorrectIndex = idx;
        return opt.replace(/\*/g, '').trim();
      }
      return opt;
    });

    if (originalCorrectIndex === -1) originalCorrectIndex = 0;

    const order = shuffleArray(cleanedOpts.map((_, i) => i));
    const shuffled = [];
    let newCorrectIndex = -1;

    order.forEach((oldIndex, newIndex) => {
      shuffled.push(cleanedOpts[oldIndex]);
      if (oldIndex === originalCorrectIndex) newCorrectIndex = newIndex;
    });

    return {
      qTextRaw: original,
      qText: original,
      options: shuffled,
      correctIndex: newCorrectIndex,
      answered: false,
      userChoice: null,
    };
  });
}

export default function McqAct({ data }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [status, setStatus] = useState('STARTED');
  const [userId, setUserId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const total = questions.length;
  const activityId = data?.id || 'mcq_default';

  useEffect(() => {
    if (!data) return;

    let currentUserId = localStorage.getItem('user_email');
    if (!currentUserId) {
      currentUserId = localStorage.getItem('mcq_guest_id');
      if (!currentUserId) {
        currentUserId = 'guest_' + Math.floor(Math.random() * 1000000);
        localStorage.setItem('mcq_guest_id', currentUserId);
      }
    }
    setUserId(currentUserId);

    // const initQuiz = async () => {
    //   const raw = data.questions || [];
    //   let initialQuestions = normalizeQuestions(raw);

    //   try {
    //     const ts = new Date().getTime();
    //     const res = await fetch(
    //       `${API_BASE}/progress/${currentUserId}/${activityId}?t=${ts}`
    //     );

    //     if (res.ok) {
    //       const text = await res.text();
    //       if (text && text.trim() !== '') {
    //         let savedState = JSON.parse(text);

    //         if (savedState.status !== 'empty') {
    //           if (typeof savedState === 'string')
    //             savedState = JSON.parse(savedState);

    //           if (
    //             savedState.questions &&
    //             savedState.questions.length === initialQuestions.length
    //           ) {
    //             initialQuestions = savedState.questions;
    //           }

    //           const savedCurrent = savedState.current || 0;
    //           const savedScore = savedState.score || 0;
    //           const savedAttempted = savedState.attempted || 0;

    //           setCurrent(savedCurrent);
    //           setScore(savedScore);
    //           setAttempted(savedAttempted);

    //           if (
    //             savedCurrent >= initialQuestions.length ||
    //             (initialQuestions.length > 0 &&
    //               savedAttempted === initialQuestions.length)
    //           ) {
    //             setStatus('SUMMARY');
    //           }
    //         }
    //       }
    //     }
    //   } catch (err) {}

    //   setQuestions(initialQuestions);
    // };

    const initQuiz = async () => {
      const raw = data.questions || [];
      let initialQuestions = normalizeQuestions(raw);

      try {
        // 1. Single clean call to your central service
        const savedState = await apiService.getMcqProgress(
          currentUserId,
          activityId
        );

        // 2. Logic remains the same, but data is already parsed
        if (savedState && savedState.status !== 'empty') {
          if (
            savedState.questions &&
            savedState.questions.length === initialQuestions.length
          ) {
            initialQuestions = savedState.questions;
          }

          setCurrent(savedState.current || 0);
          setScore(savedState.score || 0);
          setAttempted(savedState.attempted || 0);

          const isFinished =
            (savedState.current || 0) >= initialQuestions.length ||
            savedState.attempted === initialQuestions.length;

          if (isFinished && initialQuestions.length > 0) {
            setStatus('SUMMARY');
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      }

      setQuestions(initialQuestions);
    };
    initQuiz();
  }, [data, activityId]);

  const handleOptionClick = async (idx) => {
    const q = questions[current];
    if (q.answered) return;

    const updatedQuestions = [...questions];
    const activeQ = updatedQuestions[current];

    activeQ.answered = true;
    activeQ.userChoice = idx;

    let newScore = score;
    if (idx === activeQ.correctIndex) {
      newScore += 1;
    }
    const newAttempted = attempted + 1;

    setQuestions(updatedQuestions);
    setScore(newScore);
    setAttempted(newAttempted);

    saveProgressAPI(updatedQuestions, current, newScore, newAttempted);
  };

  const saveProgressAPI = async (
    qs,
    currIdx,
    currentScore,
    currentAttempted,
    overrideStatus = 'IN_PROGRESS'
  ) => {
    if (!userId) return;
    const stateToSave = {
      current: currIdx,
      score: currentScore,
      attempted: currentAttempted,
      questions: qs,
      total: qs.length,
    };

    try {
      await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          activity_id: activityId,
          progress_json: JSON.stringify(stateToSave),
          score: currentScore,
          attempted: currentAttempted,
          status: overrideStatus,
        }),
      });
    } catch (err) {}
  };

  const completeQuizAPI = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          activity_id: activityId,
          score: score,
          attempted: attempted,
        }),
      });
    } catch (err) {}
  };

  const handleNext = async () => {
    setIsSaving(true);
    if (current + 1 < total) {
      const nextIdx = current + 1;
      await saveProgressAPI(questions, nextIdx, score, attempted);
      setCurrent(nextIdx);
    } else {
      await saveProgressAPI(questions, current, score, attempted, 'COMPLETED');
      await completeQuizAPI();
      setStatus('SUMMARY');
    }
    setIsSaving(false);
  };

  const handleFinalNext = () => {
    try {
      window.parent.postMessage(
        JSON.stringify({ done: true, score: score, total: attempted }),
        '*'
      );
    } catch (_) {}
  };

  if (questions.length === 0) return null;

  const currentQ = questions[current];
  const isSummary = status === 'SUMMARY';

  // return (
  //   <div className={styles.container}>
  //     {!isSummary ? (
  //       <div className={styles.main}>
  //         {/* TITLE */}
  //         <div className={styles.title} id="actTitle">
  //           {data.title || 'Multiple Choice Question'}
  //         </div>

  //         <div id="questionTitle" className={styles.small}>
  //           Question {current + 1} of {total}
  //         </div>

  //         <div id="qwrap" className={styles.qwrap}>
  //           {/* Passage Box */}
  //           {data.passage && (
  //             <div className={styles.passageBox}>{data.passage}</div>
  //           )}

  //           {/* Question Text */}
  //           <div
  //             className={styles.question}
  //             dangerouslySetInnerHTML={{ __html: currentQ.qText }}
  //           />

  //           {/* Options */}
  //           <div className={styles.options}>
  //             {currentQ.options.map((opt, i) => {
  //               let optionClass = styles.option;
  //               if (currentQ.answered) {
  //                 if (i === currentQ.correctIndex)
  //                   optionClass += ` ${styles.correct}`;
  //                 else if (i === currentQ.userChoice)
  //                   optionClass += ` ${styles.wrong}`;
  //                 if (i === currentQ.userChoice)
  //                   optionClass += ` ${styles.selected}`;
  //               }

  //               return (
  //                 <div
  //                   key={i}
  //                   className={optionClass}
  //                   data-index={i}
  //                   onClick={() => handleOptionClick(i)}
  //                 >
  //                   <span className={styles.radio}></span>
  //                   <div className={styles.optionLabel}>{opt}</div>
  //                 </div>
  //               );
  //             })}
  //           </div>

  //           {/* Marks rendered strictly inside qwrap like original HTML */}
  //           {currentQ.answered &&
  //             currentQ.userChoice === currentQ.correctIndex && (
  //               <div
  //                 id="rightMark"
  //                 className={`${styles.mark} ${styles.right}`}
  //               >
  //                 ✔
  //               </div>
  //             )}
  //           {currentQ.answered &&
  //             currentQ.userChoice !== currentQ.correctIndex && (
  //               <div
  //                 id="wrongMark"
  //                 className={`${styles.mark} ${styles.wrong}`}
  //               >
  //                 ✖
  //               </div>
  //             )}
  //         </div>

  //         {/* CONTROLS */}
  //         <div className={styles.controls}>
  //           <div className={styles.score} id="scoreBox">
  //             Score : {score} / {total}
  //           </div>
  //           <div style={{ marginLeft: 'auto' }}>
  //             <button
  //               className={`${styles.btn} ${styles.primary}`}
  //               id="nextBtn"
  //               style={{ display: currentQ.answered ? 'inline-block' : 'none' }}
  //               onClick={handleNext}
  //               disabled={isSaving}
  //             >
  //               {isSaving
  //                 ? 'Saving...'
  //                 : current + 1 === total
  //                   ? 'Finish'
  //                   : 'Next'}
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     ) : (
  //       /* FINAL SUMMARY VIEW */
  //       <div
  //         id="finalWrap"
  //         className={styles.main}
  //         style={{ marginTop: '18px' }}
  //       >
  //         <div className={styles.title}>You have completed this activity.</div>

  //         <div id="summaryList" className={styles.summary}>
  //           {questions.map((q, i) => {
  //             const isCorrect = q.userChoice === q.correctIndex;
  //             return (
  //               <div
  //                 key={i}
  //                 className={styles.summaryItem}
  //                 style={{ padding: '10px 0' }}
  //               >
  //                 <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
  //                   {i + 1}. {q.qTextRaw}
  //                 </div>
  //                 <div style={{ fontSize: '0.9em' }}>
  //                   Your Answer:{' '}
  //                   <span
  //                     style={{
  //                       color: isCorrect ? '#2ecc71' : '#e74c3c',
  //                       fontWeight: 'bold',
  //                     }}
  //                   >
  //                     {q.options[q.userChoice] || 'Skipped'}
  //                   </span>
  //                   {!isCorrect && (
  //                     <span style={{ color: '#777', marginLeft: '8px' }}>
  //                       (Correct: {q.options[q.correctIndex]})
  //                     </span>
  //                   )}
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>

  //         <div
  //           style={{
  //             display: 'flex',
  //             alignItems: 'center',
  //             justifyContent: 'space-between',
  //             marginTop: '12px',
  //           }}
  //         >
  //           <div className={styles.small} id="finalScore">
  //             Final Score: {score} / {attempted}
  //           </div>
  //           <button
  //             className={`${styles.btn} ${styles.primary}`}
  //             id="finalNextBtn"
  //             onClick={handleFinalNext}
  //           >
  //             Next
  //           </button>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {!isSummary ? (
          <div className={styles.main}>
            {/* TITLE */}
            <div className={styles.title} id="actTitle">
              {data.title || 'Multiple Choice Question'}
            </div>

            <div id="questionTitle" className={styles.small}>
              Question {current + 1} of {total}
            </div>

            <div id="qwrap" className={styles.qwrap}>
              {/* Passage Box */}
              {data.passage && (
                <div className={styles.passageBox}>{data.passage}</div>
              )}

              {/* Question Text */}
              <div
                className={styles.question}
                dangerouslySetInnerHTML={{ __html: currentQ.qText }}
              />

              {/* Options */}
              <div className={styles.options}>
                {currentQ.options.map((opt, i) => {
                  let optionClass = styles.option;
                  if (currentQ.answered) {
                    if (i === currentQ.correctIndex)
                      optionClass += ` ${styles.correct}`;
                    else if (i === currentQ.userChoice)
                      optionClass += ` ${styles.wrong}`;
                    if (i === currentQ.userChoice)
                      optionClass += ` ${styles.selected}`;
                  }

                  return (
                    <div
                      key={i}
                      className={optionClass}
                      data-index={i}
                      onClick={() => handleOptionClick(i)}
                    >
                      <span className={styles.radio}></span>
                      <div className={styles.optionLabel}>{opt}</div>
                    </div>
                  );
                })}
              </div>

              {/* Marks rendered strictly inside qwrap like original HTML */}
              {currentQ.answered &&
                currentQ.userChoice === currentQ.correctIndex && (
                  <div
                    id="rightMark"
                    className={`${styles.mark} ${styles.right}`}
                  >
                    ✔
                  </div>
                )}
              {currentQ.answered &&
                currentQ.userChoice !== currentQ.correctIndex && (
                  <div
                    id="wrongMark"
                    className={`${styles.mark} ${styles.wrong}`}
                  >
                    ✖
                  </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className={styles.controls}>
              <div className={styles.score} id="scoreBox">
                Score : {score} / {total}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  id="nextBtn"
                  style={{
                    display: currentQ.answered ? 'inline-block' : 'none',
                  }}
                  onClick={handleNext}
                  disabled={isSaving}
                >
                  {isSaving
                    ? 'Saving...'
                    : current + 1 === total
                      ? 'Finish'
                      : 'Next'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FINAL SUMMARY VIEW */
          <div
            id="finalWrap"
            className={styles.main}
            style={{ marginTop: '18px' }}
          >
            <div className={styles.title}>
              You have completed this activity.
            </div>

            <div id="summaryList" className={styles.summary}>
              {questions.map((q, i) => {
                const isCorrect = q.userChoice === q.correctIndex;
                return (
                  <div
                    key={i}
                    className={styles.summaryItem}
                    style={{ padding: '10px 0' }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {i + 1}. {q.qTextRaw}
                    </div>
                    <div style={{ fontSize: '0.9em' }}>
                      Your Answer:{' '}
                      <span
                        style={{
                          color: isCorrect ? '#2ecc71' : '#e74c3c',
                          fontWeight: 'bold',
                        }}
                      >
                        {q.options[q.userChoice] || 'Skipped'}
                      </span>
                      {!isCorrect && (
                        <span style={{ color: '#777', marginLeft: '8px' }}>
                          (Correct: {q.options[q.correctIndex]})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
              }}
            >
              <div className={styles.small} id="finalScore">
                Final Score: {score} / {attempted}
              </div>
              <button
                className={`${styles.btn} ${styles.primary}`}
                id="finalNextBtn"
                onClick={handleFinalNext}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
