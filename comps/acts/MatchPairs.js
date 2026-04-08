import React, { useEffect, useState, useRef } from "react";
import styles from "./MatchPairs.module.css";

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function MatchPairs({ data }) {
  const [pairs, setPairs] = useState([]);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [connections, setConnections] = useState([]);

  const [dragging, setDragging] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredRight, setHoveredRight] = useState(null);

  const [evaluated, setEvaluated] = useState(false);
  const [score, setScore] = useState(0);

  const containerRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});

  useEffect(() => {
    if (!data?.text) return;

    const lines = data.text.trim().split("\n");
    const parsed = lines.map((line) => {
      const [left, right] = line.split(",");
      return {
        left: left.trim(),
        right: right.trim(),
      };
    });

    setPairs(parsed);
    setLeftItems(parsed.map((p) => p.left));
    setRightItems(shuffle(parsed.map((p) => p.right)));
    setConnections([]);
    setEvaluated(false);
  }, [data]);

  // Helper to get relative coordinates within the container
  const getPoint = (el, side) => {
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();

    return {
      // If left side, point starts at the right edge of the box
      // If right side, point ends at the left edge of the box
      x:
        side === "left"
          ? rect.right - parentRect.left
          : rect.left - parentRect.left,
      y: rect.top - parentRect.top + rect.height / 2,
    };
  };

  const handleMouseDown = (e, item) => {
    if (evaluated) return;
    e.preventDefault(); // Prevent text selection while dragging

    const startPoint = getPoint(leftRefs.current[item], "left");
    setDragging({
      left: item,
      startX: startPoint.x,
      startY: startPoint.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - parentRect.left,
      y: e.clientY - parentRect.top,
    });
  };

  const handleMouseUp = () => {
    if (!dragging) return;

    if (hoveredRight) {
      const newConnections = [
        ...connections.filter((c) => c.left !== dragging.left),
        { left: dragging.left, right: hoveredRight },
      ];

      setConnections(newConnections);

      if (newConnections.length === pairs.length) {
        evaluate(newConnections);
      }
    }

    setDragging(null);
    setHoveredRight(null);
  };

  const evaluate = (conn) => {
    let correct = 0;
    conn.forEach((c) => {
      const match = pairs.find((p) => p.left === c.left);
      if (match?.right === c.right) correct++;
    });
    setScore(correct);
    setEvaluated(true);
  };

  const getLineColorClass = (left, right) => {
    if (!evaluated) return styles.lineDefault;
    const match = pairs.find((p) => p.left === left);
    return match?.right === right ? styles.correct : styles.wrong;
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{data.title || "Match the Pairs"}</h2>

      <div
        className={styles.matchContainer}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(null)} // Stop dragging if mouse leaves area
      >
        {/* LEFT COLUMN */}
        <div className={styles.column}>
          {leftItems.map((item, i) => (
            <div
              key={`left-${i}`}
              ref={(el) => (leftRefs.current[item] = el)}
              className={`${styles.box} ${dragging?.left === item ? styles.selected : ""}`}
              onMouseDown={(e) => handleMouseDown(e, item)}
            >
              {item}
            </div>
          ))}
        </div>

        {/* SVG DRAWING LAYER */}
        <svg className={styles.lines}>
          {/* Render established connections */}
          {connections.map((c, i) => {
            const p1 = getPoint(leftRefs.current[c.left], "left");
            const p2 = getPoint(rightRefs.current[c.right], "right");

            return (
              <line
                key={`conn-${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className={getLineColorClass(c.left, c.right)}
              />
            );
          })}

          {/* Render active dragging line */}
          {dragging && (
            <line
              x1={dragging.startX}
              y1={dragging.startY}
              x2={
                hoveredRight
                  ? getPoint(rightRefs.current[hoveredRight], "right").x
                  : mousePos.x
              }
              y2={
                hoveredRight
                  ? getPoint(rightRefs.current[hoveredRight], "right").y
                  : mousePos.y
              }
              className={styles.lineDefault}
              strokeDasharray="5,5" // Optional: makes the dragging line dashed
            />
          )}
        </svg>

        {/* RIGHT COLUMN */}
        <div className={styles.column}>
          {rightItems.map((item, i) => (
            <div
              key={`right-${i}`}
              ref={(el) => (rightRefs.current[item] = el)}
              className={`${styles.box} ${hoveredRight === item ? styles.hoverTarget : ""}`}
              onMouseEnter={() => setHoveredRight(item)}
              onMouseLeave={() => setHoveredRight(null)}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {evaluated && (
        <div className={styles.result}>
          Score: {score} / {pairs.length}
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useState, useRef } from "react";
// import styles from "./MatchPairs.module.css";

// function shuffle(array) {
//   return [...array].sort(() => Math.random() - 0.5);
// }

// export default function MatchPairs({ data }) {
//   const [pairs, setPairs] = useState([]);
//   const [leftItems, setLeftItems] = useState([]);
//   const [rightItems, setRightItems] = useState([]);
//   const [connections, setConnections] = useState([]);

//   const [dragging, setDragging] = useState(null);
//   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//   const [hoveredRight, setHoveredRight] = useState(null);

//   const [evaluated, setEvaluated] = useState(false);
//   const [score, setScore] = useState(0);

//   const containerRef = useRef(null);
//   const leftRefs = useRef({});
//   const rightRefs = useRef({});

//   useEffect(() => {
//     if (!data?.text) return;

//     const parsed = data.text.split("\n").map((line) => {
//       const [left, right] = line.split(",");
//       return {
//         left: left.trim(),
//         right: right.trim(),
//       };
//     });

//     setPairs(parsed);
//     setLeftItems(parsed.map((p) => p.left));
//     setRightItems(shuffle(parsed.map((p) => p.right)));
//   }, [data]);

//   const getLeftPoint = (el) => {
//     const rect = el.getBoundingClientRect();
//     const parent = containerRef.current.getBoundingClientRect();

//     return {
//       x: rect.right - parent.left,
//       y: rect.top - parent.top + rect.height / 2,
//     };
//   };

//   const getRightPoint = (el) => {
//     const rect = el.getBoundingClientRect();
//     const parent = containerRef.current.getBoundingClientRect();

//     return {
//       x: rect.left - parent.left,
//       y: rect.top - parent.top + rect.height / 2,
//     };
//   };

//   // 🟢 START DRAG
//   const handleMouseDown = (item) => {
//     if (evaluated) return;

//     const el = leftRefs.current[item];
//     const start = getLeftPoint(el);

//     setDragging({
//       left: item,
//       startX: start.x,
//       startY: start.y,
//     });
//   };

//   // 🔵 DRAG MOVE
//   const handleMouseMove = (e) => {
//     if (!dragging) return;

//     const parent = containerRef.current.getBoundingClientRect();

//     setMousePos({
//       x: e.clientX - parent.left,
//       y: e.clientY - parent.top,
//     });
//   };

//   // 🔴 DROP
//   const handleMouseUp = () => {
//     if (!dragging) return;

//     if (hoveredRight) {
//       const newConnections = [
//         ...connections.filter((c) => c.left !== dragging.left),
//         { left: dragging.left, right: hoveredRight },
//       ];

//       setConnections(newConnections);

//       if (newConnections.length === pairs.length) {
//         evaluate(newConnections);
//       }
//     }

//     setDragging(null);
//     setHoveredRight(null);
//   };

//   const evaluate = (conn) => {
//     let correct = 0;

//     conn.forEach((c) => {
//       const match = pairs.find((p) => p.left === c.left);
//       if (match?.right === c.right) correct++;
//     });

//     setScore(correct);
//     setEvaluated(true);
//   };

//   const getLineColor = (left, right) => {
//     if (!evaluated) return styles.lineDefault;

//     const match = pairs.find((p) => p.left === left);
//     return match?.right === right ? styles.correct : styles.wrong;
//   };

//   return (
//     <div
//       className={styles.wrapper}
//       ref={containerRef}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//     >
//       <h2 className={styles.title}>{data.title}</h2>

//       <div className={styles.matchContainer}>
//         {/* LEFT */}
//         <div className={styles.column}>
//           {leftItems.map((item, i) => (
//             <div
//               key={i}
//               ref={(el) => (leftRefs.current[item] = el)}
//               className={styles.box}
//               onMouseDown={() => handleMouseDown(item)}
//             >
//               {item}
//             </div>
//           ))}
//         </div>

//         {/* SVG */}
//         <svg className={styles.lines}>
//           {/* EXISTING */}
//           {connections.map((c, i) => {
//             const p1 = getLeftPoint(leftRefs.current[c.left]);
//             const p2 = getRightPoint(rightRefs.current[c.right]);

//             return (
//               <line
//                 key={i}
//                 x1={p1.x}
//                 y1={p1.y}
//                 x2={p2.x}
//                 y2={p2.y}
//                 className={getLineColor(c.left, c.right)}
//               />
//             );
//           })}

//           {/* DRAGGING */}
//           {dragging && (
//             <line
//               x1={dragging.startX}
//               y1={dragging.startY}
//               x2={
//                 hoveredRight
//                   ? getRightPoint(rightRefs.current[hoveredRight]).x
//                   : mousePos.x
//               }
//               y2={
//                 hoveredRight
//                   ? getRightPoint(rightRefs.current[hoveredRight]).y
//                   : mousePos.y
//               }
//               className={styles.lineDefault}
//             />
//           )}
//         </svg>

//         {/* RIGHT */}
//         <div className={styles.column}>
//           {rightItems.map((item, i) => (
//             <div
//               key={i}
//               ref={(el) => (rightRefs.current[item] = el)}
//               className={styles.box}
//               onMouseEnter={() => setHoveredRight(item)}
//               onMouseLeave={() => setHoveredRight(null)}
//             >
//               {item}
//             </div>
//           ))}
//         </div>
//       </div>

//       {evaluated && (
//         <div className={styles.result}>
//           Score: {score} / {pairs.length}
//         </div>
//       )}
//     </div>
//   );
// }
