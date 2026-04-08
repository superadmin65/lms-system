import { useEffect, useState } from "react";

export default function OnlyBigScreen({
  children,
  minSize = 900,
  allowMobile = true, // 👈 control behavior via prop
}) {
  const [screen, setScreen] = useState({
    loading: true,
    isSmall: false,
  });

  useEffect(() => {
    // 👇 Safe check for Next.js (avoids SSR crash)
    const checkScreen = () => {
      if (typeof window !== "undefined") {
        setScreen({
          loading: false,
          isSmall: window.innerWidth < minSize,
        });
      }
    };

    checkScreen(); // initial check

    // 👇 Handle resize (important for responsiveness)
    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, [minSize]);

  // ⏳ Avoid hydration mismatch
  if (screen.loading) {
    return null;
  }

  // 🚫 If mobile not allowed
  if (!allowMobile && screen.isSmall) {
    return (
      <div
        style={{
          margin: 20,
          padding: 20,
          textAlign: "center",
          color: "#ff4d4f",
          fontSize: "16px",
        }}
      >
        This page is optimized for larger screens. Please use a laptop or
        desktop for the best experience.
      </div>
    );
  }

  // ✅ Default: allow all screens
  return <>{children}</>;
}

// import { useEffect, useState } from "react";

// export default function OnlyBigScreen(props) {
//   const [state, setState] = useState({
//     loading: true,
//     smallScreen: false,
//   });

//   useEffect(() => {
//     //taken from isSmallScreen() function
//     if (window.innerWidth < (props.minSize || 900)) {
//       setState({ ...state, smallScreen: true, loading: false });
//     } else {
//       setState({ ...state, smallScreen: false, loading: false });
//     }
//   }, []);

//   if (state.loading) {
//     return <div>Loading...</div>;
//   }
//   if (state.smallScreen) {
//     return (
//       <div style={{ margin: 15, color: "red" }}>
//         Sorry. This page is available only for big screen. Kindly check this in
//         laptop or PC.
//       </div>
//     );
//   }
//   return props.children;
// }
