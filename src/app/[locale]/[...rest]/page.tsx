import { notFound } from "next/navigation";

// 이 화면은 항상 404이므로 "즉시 표시 가능" 검사(instant)는 건너뛴다
export const instant = false;

// 없는 주소(/ko/없는페이지)도 언어별 404 화면을 보여 주기 위한 자리
export default function CatchAll() {
  notFound();
}
