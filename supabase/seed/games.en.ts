export const GAME_EN: Record<string, { streamPoint?: string; cautions?: string }> = {
  bombanana: {
    streamPoint:
      "The puzzles only get solved by talking, so communication itself becomes the content. Information is split across three monkey roles: see no evil, speak no evil, and hear no evil.",
    cautions: "You need exactly 3 players.",
  },
  "escape-from-playtime": {
    streamPoint:
      "You explore the Playtime Co. factory as a Smiling Critter. There is a mini mode where you climb around at toy size.",
    cautions:
      "It is in Early Access, so there is little content at first. Plan for a short hype window and recommend it again after big updates.",
  },
};

export const FORMAT_EN: Record<string, { title: string; appealText: string; howTo: string }> = {
  "캠페인 3인 합방": {
    title: "3-Player Campaign Collab",
    appealText: "The puzzles only get solved by talking, so the conversation keeps going even between streamers who are collabbing for the first time.",
    howTo:
      "Three streamers each go live and play the same campaign stage. Viewers only see one person's point of view, so the other members' information reaches them only through speech.",
  },
  "커스텀 기록 리그": {
    title: "Custom Record League",
    appealText:
      "3-player teams compete for clear times under the same custom conditions. Each team's communication style and explosive moments are the highlights.",
    howTo:
      "Several 3-player teams stream from their own channels with the same custom settings and race for the best record. Viewers take part by cheering for a team and predicting the results.",
  },
  "시청자 공모 폭탄 도전": {
    title: "Viewer-Submitted Bomb Challenge",
    appealText: "Collect custom settings from the fan cafe (community board) and take them on.",
    howTo:
      "Three streamers take on custom settings submitted through the fan cafe (bomb difficulty, timer, and modules).",
  },
  "4인 탈출 런": {
    title: "4-Player Escape Run",
    appealText: "Screams and chemistry explode together in a 4-player escape.",
    howTo: "Four streamers each go live and try to escape the factory.",
  },
  "8인 대인원 런": {
    title: "8-Player Big Collab Run",
    appealText: "Eight people's screams sound different from each streamer's point of view.",
    howTo:
      "Eight streamers each go live and join the same match, while viewers hop between channels to watch.",
  },
  "미니 모드 탐험": {
    title: "Mini Mode Exploration",
    appealText: "The fun of seeing familiar places again from a toy-sized point of view.",
    howTo: "Shrunk down to toy size, you climb around the factory and explore it.",
  },
};

export const GENRE_EN: Record<string, string> = {
  액션: "Action",
  어드벤처: "Adventure",
  인디: "Indie",
  캐주얼: "Casual",
  전략: "Strategy",
  시뮬레이션: "Simulation",
  RPG: "RPG",
  레이싱: "Racing",
  스포츠: "Sports",
  "대규모 멀티플레이어": "Massively Multiplayer",
  "무료 플레이": "Free to Play",
  "앞서 해보기": "Early Access",
  "얼리 액세스": "Early Access",
  "협동 서바이벌 호러 익스트랙션": "Co-op Survival Horror Extraction",
};
