import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// PandaCSS가 만든 CSS 레이어 순서 정의 + 실제 스타일들이 여기서 로드됩니다.
// (panda.config.mjs의 outdir 설정에 따라 styled-system 폴더가 생성되고,
//  index.css는 그 결과물을 최종적으로 불러오는 진입점 역할)
import "./index.css";
import App from "./App.jsx";


// StrictMode는 개발 중에만 잠재적 버그(예: 부수효과가 있는 렌더링)를 찾기 위해
// 일부 로직을 일부러 두 번 실행해보는 개발용 도구이고, 실제 배포 빌드에는 영향 없습니다.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
