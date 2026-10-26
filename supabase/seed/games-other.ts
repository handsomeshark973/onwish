// Steam에 없는 게임 3개. 공식 페이지에서 직접 확인한 값만 적었다. 확인하지 못한 값은 null.
export const OTHER_GAMES = [
  {
    slug: "minecraft",
    name: "Minecraft",
    nameKo: "마인크래프트",
    developer: "Mojang",
    publisher: "Microsoft Studios",
    // Xbox 공식 페이지(xbox.com/en-US/games/minecraft): 개발 Mojang, 배급 Microsoft Studios, Windows 10/11 지원, 2017-09-20.
    // 같은 페이지에 "Cross-platform play extends across Windows 10/11 PCs, Android, iOS, Xbox One, Nintendo Switch, VR"라고 적혀 있다.
    // PS5·Switch 지원 여부는 이 페이지로 직접 확인되지 않아 플랫폼은 PC만 적는다.
    platforms: ["PC"] as const,
    crossplay: true,
    releaseDate: "2017-09-20",
    priceNote: null as string | null,
    genre: ["액션", "어드벤처"],
    imageUrl: null as string | null,
    sources: [{ title: "Xbox 공식 페이지 · Minecraft", url: "https://www.xbox.com/en-US/games/minecraft" }],
  },
  {
    slug: "roblox",
    name: "Roblox",
    nameKo: "로블록스",
    developer: "Roblox Corporation",
    publisher: null as string | null,
    // 공식 소개 페이지(about.roblox.com) 푸터에 "© 2026 Roblox Corporation"이라고 적혀 있다. 플랫폼·가격은 이 페이지에 없다.
    platforms: [] as never[],
    crossplay: null as boolean | null,
    releaseDate: null as string | null,
    priceNote: null as string | null,
    genre: [] as string[],
    imageUrl: null as string | null,
    sources: [{ title: "Roblox 공식 소개 페이지", url: "https://about.roblox.com/" }],
  },
  {
    slug: "super-mario-maker-2",
    name: "Super Mario Maker 2",
    nameKo: "슈퍼 마리오 메이커 2",
    developer: "Nintendo", // 페이지에 개발사는 없고 배급사가 Nintendo라고 적혀 있어 같은 이름을 쓴다
    publisher: "Nintendo",
    // Nintendo 미국 스토어 페이지: Nintendo Switch(Switch 2 호환), 1대 1~4명·로컬 무선 2~4명·온라인 2~4명, 미화 $59.99
    platforms: ["SWITCH"] as const,
    crossplay: null as boolean | null,
    releaseDate: null as string | null,
    priceNote: "미화 $59.99 (Nintendo 미국 스토어, 2026-10-26 확인)",
    genre: [] as string[],
    players: { min: 1, max: 4 },
    imageUrl: null as string | null,
    sources: [{ title: "Nintendo 미국 스토어 · Super Mario Maker 2", url: "https://www.nintendo.com/us/store/products/super-mario-maker-2-switch/" }],
  },
];
