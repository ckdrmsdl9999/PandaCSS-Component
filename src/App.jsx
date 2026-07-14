import { HomePage } from "./pages/HomePage";
import { MockExternalPage } from "./pages/MockExternalPage";

/**
 * 이 앱은 페이지가 딱 2개뿐이라(메인 / 목업 외부 페이지) react-router 같은
 * 별도 라우팅 라이브러리를 쓰지 않고, 그냥 현재 주소의 pathname을 직접
 * 확인해서 어느 컴포넌트를 보여줄지 결정합니다.
 *
 * "/external"로 시작하는 주소면 MockExternalPage(목업 외부 페이지)를,
 * 그 외에는 전부 HomePage(슬롯 참여 화면)를 보여줍니다.
 * ("/external"은 useVisitSession.startVisit()이 새 탭을 열 때 사용하는 경로)
 *
 * 참고: Vite dev 서버/preview는 기본적으로 SPA 모드라서, "/external" 같은
 * 하위 경로로 직접 접속해도 index.html이 서빙되고 이 App.jsx가 그대로 실행됩니다.
 */
export default function App() {
  const isExternalPage = window.location.pathname.startsWith("/external");
  return isExternalPage ? <MockExternalPage /> : <HomePage />;
}
