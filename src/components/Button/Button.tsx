import { forwardRef, type ButtonHTMLAttributes } from "react";
import { button } from "../../../styled-system/recipes";
import { cx } from "../../../styled-system/css";

//타입지정
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

/**
 * 네이티브 <button> 속성(onClick, disabled, type 등)을 그대로 확장해서, 이 컴포넌트를
 * 쓰는 쪽이 <button>에 넘길 수 있는 것은 전부 그대로 넘길 수 있게 합니다. variant/size는
 * `theme/recipes/button.recipe.js`의 PandaCSS 레시피 variant와 이름을 맞춰뒀습니다.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 처리 중임을 표시. true면 버튼 글자를 "로딩중..."으로 바꾸고 클릭을 막음 */
  loading?: boolean;
  /** 부모 너비를 꽉 채울지 여부 */
  fullWidth?: boolean;
}

/**
 * variant, size, disabled, loading 4가지 상태를 모두 지원하는
 * 재사용 가능한 버튼 컴포넌트입니다.
 *
 * variant / size는 실제 색상·크기 CSS를 직접 여기서 정의하지 않고,
 * `theme/recipes/button.recipe.js`에 PandaCSS "레시피"로 정의해뒀습니다.
 * 그 레시피가 `panda codegen` 시점에 `styled-system/recipes`에 `button()`이라는
 * 함수로 자동 생성되고, 여기서는 그 함수를 불러와 props를 넘기기만 하면
 * 알맞은 CSS 클래스 문자열이 반환됩니다. (변형(variant)마다 클래스를 직접
 * if/else로 작성하지 않아도 되는 것이 PandaCSS 레시피의 장점이고, button()의
 * 인자 타입은 panda codegen이 만든 styled-system/recipes/button.d.ts로 이미
 * 체크됩니다.)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
    className,
    children,
    type = "button",
    ...rest
  },
  ref
) {
  // "로딩 중"이면 사용자가 중복 클릭하지 못하도록 disabled와 동일하게 취급합니다.
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      // 스크린 리더 등 보조기기에 "지금 처리 중"임을 알려주는 접근성(a11y) 속성.
      // loading이 false일 때는 속성 자체를 안 붙이려고 undefined를 사용.
      aria-busy={loading || undefined}
      // cx()는 여러 클래스 문자열을 안전하게 합쳐주는 PandaCSS 유틸리티입니다.
      // button({...}) 레시피가 만든 기본 클래스에, 호출하는 쪽에서 넘겨준
      // className(있다면)을 이어붙여서 최종 클래스를 만듭니다.
      className={cx(button({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? "로딩중..." : children}
    </button>
  );
});
