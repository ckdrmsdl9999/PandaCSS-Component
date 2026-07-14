import { forwardRef } from "react";
import { button } from "../../../styled-system/recipes";
import { cx } from "../../../styled-system/css";

/**
 * variant, size, disabled, loading 4가지 상태를 모두 지원하는
 * 재사용 가능한 버튼 컴포넌트입니다.
 *
 * variant / size는 실제 색상·크기 CSS를 직접 여기서 정의하지 않고,
 * `theme/recipes/button.recipe.js`에 PandaCSS "레시피"로 정의해뒀습니다.
 * 그 레시피가 `panda codegen` 시점에 `styled-system/recipes`에 `button()`이라는
 * 함수로 자동 생성되고, 여기서는 그 함수를 불러와 props를 넘기기만 하면
 * 알맞은 CSS 클래스 문자열이 반환됩니다. (변형(variant)마다 클래스를 직접
 * if/else로 작성하지 않아도 되는 것이 PandaCSS 레시피의 장점)
 *
 * Props
 * - variant: 'primary' | 'secondary' | 'ghost' (버튼 색상 스타일)
 * - size: 'sm' | 'md' | 'lg' (버튼 크기)
 * - disabled: 클릭 불가 여부
 * - loading: 처리 중임을 표시. true면 버튼 글자를 "로딩중..."으로 바꾸고 클릭을 막음
 * - fullWidth: 부모 너비를 꽉 채울지 여부
 * - 그 외 나머지(...rest)는 그대로 <button> 태그에 전달되어 onClick 등을 그대로 사용 가능
 */
export const Button = forwardRef(function Button(
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
