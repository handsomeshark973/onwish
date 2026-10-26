import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 사이트 안 이동은 next/link 대신 이것을 쓴다. 현재 언어가 주소에 자동으로 붙는다.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
