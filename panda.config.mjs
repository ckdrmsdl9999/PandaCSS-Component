import { defineConfig } from "@pandacss/dev";
import { buttonRecipe } from "./src/theme/recipes/button.recipe.js";

// PandaCSS 설정 파일입니다. `npm run dev`/`npm run build` 전에 실행되는
// `panda codegen`이 이 설정을 읽어서 `styled-system/` 폴더 안에 실제로
// 사용할 css(), cx(), button() 같은 함수/스타일 결과물을 생성합니다.
// TypeScript는 쓰지 않기로 해서 .mjs(순수 JS) 형식으로 작성했습니다.
export default defineConfig({
  // css reset(브라우저 기본 스타일 초기화)을 자동으로 넣어줄지 여부
  preflight: true,

  // 어떤 파일들 안에서 css()/button() 같은 PandaCSS 함수 호출을 찾아
  // 스타일을 추출할지 지정. src 아래의 .js/.jsx 파일만 스캔합니다 (TS 미사용).
  include: ["./src/**/*.{js,jsx}"],

  // 스캔에서 제외할 파일 패턴
  exclude: [],

  // "styled-system/jsx" 산출물(예: <styled.div>)을 React용으로 생성하도록 설정
  jsxFramework: "react",

  // 테마 커스터마이징: 기본 PandaCSS 프리셋에 우리 프로젝트만의 값을 추가(extend)
  theme: {
    extend: {
      // 색상 토큰(디자인 시스템에서 쓰는 색상 팔레트). "brand.600"처럼
      // 컴포넌트 코드에서 문자열 토큰 이름으로 참조할 수 있게 해줍니다.
      tokens: {
        colors: {
          brand: {
            50: { value: "#eef4ff" },
            100: { value: "#dbe6fe" },
            600: { value: "#3b5bdb" },
            700: { value: "#2f4bc7" },
            800: { value: "#263ea3" },
          },
          // 추가 기회(ghost) 버튼 전용 색상. primary(파란색)와 한눈에 구분되도록
          // 완전히 다른 색상(호박색 계열)을 씁니다.
          accent: {
            500: { value: "#f59e0b" },
            600: { value: "#d97706" },
            700: { value: "#b45309" },
          },
        },
      },
      // 위에서 만든 buttonRecipe를 "button"이라는 이름으로 등록.
      // 이렇게 등록해야 codegen 후 styled-system/recipes에서 `button(...)` 함수로 쓸 수 있습니다.
      recipes: {
        button: buttonRecipe,
      },
    },
  },

  // codegen 결과물(styled-system 폴더)이 생성될 위치.
  // 이 폴더는 자동 생성 산출물이라 .gitignore에 등록되어 있고,
  // package.json의 "prepare"/"dev"/"build" 스크립트가 실행될 때마다 다시 만들어집니다.
  outdir: "styled-system",
});
