import { defineRecipe } from "@pandacss/dev";

export const buttonRecipe = defineRecipe({
  className: "button", // 생성되는 CSS 클래스 이름의 접두사 (예: button--variant_primary)
  description: "Base styles for the Button component",

  // base: variant/size와 상관없이 모든 버튼에 공통으로 적용되는 기본 스타일
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontWeight: "600",
    borderRadius: "lg",
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease",
    whiteSpace: "nowrap",
    // "_disabled"는 PandaCSS가 제공하는 조건부 스타일(가상 클래스) 문법으로,
    // 실제로는 &:disabled 셀렉터로 컴파일됩니다. Button.jsx에서 <button disabled>
    // 속성을 켜면 자동으로 이 스타일이 적용됩니다. (JS로 상태를 분기할 필요 없음)
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },

  // variants: Button에서 props로 넘기는 옵션들과 그에 대응하는 스타일
  variants: {
    // 색상 스타일 3종
    variant: {
      primary: {
        backgroundColor: "brand.600",
        color: "white",
        _hover: { backgroundColor: "brand.700" }, // 마우스 오버 시 살짝 진하게
        _active: { backgroundColor: "brand.800" }, // 클릭하는 순간 더 진하게
      },
      secondary: {
        backgroundColor: "gray.100",
        color: "gray.900",
        borderColor: "gray.200",
        _hover: { backgroundColor: "gray.200" },
        _active: { backgroundColor: "gray.300" },
      },
      ghost: {
        // primary(파란색)와 색 자체로 구분되도록 호박색 계열을 채워 넣은 스타일
        // (추가 기회 버튼에 사용 - 테두리가 아니라 색으로 눈에 띄게 함)
        backgroundColor: "accent.500",
        color: "white",
        _hover: { backgroundColor: "accent.600" },
        _active: { backgroundColor: "accent.700" },
      },
    },
    // 크기 3종: 글자 크기, 좌우/상하 여백, 높이를 함께 조절
    size: {
      sm: { fontSize: "sm", paddingX: "3", paddingY: "1.5", height: "8" },
      md: { fontSize: "md", paddingX: "4", paddingY: "2", height: "10" },
      lg: { fontSize: "lg", paddingX: "6", paddingY: "3", height: "12" },
    },
    // 불리언(boolean) variant: fullWidth={true}일 때만 width:full 스타일 적용
    fullWidth: {
      true: { width: "full" },
    },
  },

  // props를 안 넘겼을 때 기본으로 쓰일 값들
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});
