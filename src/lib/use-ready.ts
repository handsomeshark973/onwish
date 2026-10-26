"use client";

import { useSyncExternalStore } from "react";

// 화면이 브라우저에서 완전히 연결됐는지(hydration 끝) 알려 준다. 서버에서 그린 첫 화면에서는 false, 연결된 뒤에는 true.
// 연결되기 전에 폼이 제출되면 브라우저가 입력값을 주소창에 붙여 보내므로, 제출 버튼을 이때까지 막는 데 쓴다.
const subscribe = () => () => {};
export const useReady = () => useSyncExternalStore(subscribe, () => true, () => false);
