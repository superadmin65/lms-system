import React, { useState, useEffect, useMemo } from "react";
import styles from "./completePuzzle.module.css";

export default function JoinWords({ data }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedSuffix, setPlacedSuffix] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);

  const puzzles = useMemo(() => {
    if (!data?.data?.text) return [];
    return data.data.text.split("\n").map((line) => {
      const [prefix, correct, distractor] = line
        .split(",")
        .map((s) => s.trim());
      return {
        prefix,
        correct,
        options: [correct, distractor].sort(() => Math.random() - 0.5),
      };
    });
  }, [data]);

  const currentPuzzle = puzzles[currentIndex];

  const handleDragStart = (e, word) => {
    e.dataTransfer.setData("text/plain", word);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedWord = e.dataTransfer.getData("text/plain");
    if (isCorrect) return;

    setPlacedSuffix(droppedWord);

    if (droppedWord === currentPuzzle.correct) {
      setIsCorrect(true);
      setScore((prev) => prev + 1);
    } else {
      setIsCorrect(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPlacedSuffix(null);
      setIsCorrect(null);
    }
  };

  if (!currentPuzzle) return null;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{data.data.title}</h2>

      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          <div className={styles.prefixPiece}>
            {currentPuzzle.prefix}
            <div className={styles.tab}></div>
          </div>

          <div
            className={`${styles.dropZone} ${isCorrect ? styles.hitCorrect : ""} ${isCorrect === false ? styles.hitWrong : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className={styles.slot}></div>
            {placedSuffix && (
              <span className={styles.placedText}>{placedSuffix}</span>
            )}
          </div>
        </div>

        <div className={styles.optionsContainer}>
          {currentPuzzle.options.map((option, idx) => {
            // Hides the word from the list if it has been dragged into the slot
            if (placedSuffix === option)
              return <div key={idx} className={styles.hiddenOption} />;

            return (
              <div
                key={`${currentIndex}-${idx}`}
                className={styles.optionPiece}
                draggable={!isCorrect}
                onDragStart={(e) => handleDragStart(e, option)}
              >
                <div className={styles.slot}></div>
                {option}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.scoreBoard}>
          Score : {score} / {puzzles.length}
        </div>
        {isCorrect && (
          <button className={styles.nextBtn} onClick={nextQuestion}>
            {currentIndex === puzzles.length - 1 ? "Finish" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
