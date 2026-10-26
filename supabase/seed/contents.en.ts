export type ContentEn = {
  title: string;
  appealText: string;
  howTo: string[];
  multiPov?: string;
  by?: { s?: string; m?: string; l?: string };
  continuity?: string;
  cautions?: string;
  setup?: string;
  gamesText?: string;
  borrowedFrom?: string;
};

const SEASON = "Stack up points in a season ledger and you can keep going even when the game changes.";
const CLIP = "After the stream, post highlights as clips and Shorts and use them as a teaser for the next stream.";

export const CONTENT_EN: Record<string, ContentEn> = {
  // ───── A. Solo streams ─────
  "solo-blind-first-play": {
    title: "Blind First Play of a New Release",
    appealText: "Your raw reactions to scenes you have never seen are both the sight and the sound of the show.",
    howTo: [
      "Tell chat before the stream that you have not watched any videos or guides.",
      "Narrate how you feel at every new scene as it happens.",
      "Chat follows a no-spoilers rule, and you filter out anyone who breaks it right away.",
      "Save the moments that shocked you as clips and post them as Shorts.",
    ],
    by: {
      s: "Chat acts as the guard that blocks spoilers.",
      m: "Decide the no-spoiler rule by vote and spot who broke it.",
      l: "Set the no-spoiler rule and watch the chat reaction meter together.",
    },
    continuity: CLIP,
    cautions: "Spoilers from viewers are the biggest risk. Pick chat moderators ahead of time.",
  },
  "solo-no-death-run": {
    title: "No-Death and Challenge Runs",
    appealText: "Skillful moments and successful runs turn straight into clips.",
    howTo: [
      "Tell chat the challenge rules (no deaths, time limit, and so on) at the start of the stream.",
      "Turn chat off for a moment and play through the sections that need focus.",
      "Stop before a dangerous section and predict the death spot with viewers.",
      "Save the success and failure moments as clips and post them as Shorts.",
    ],
    by: {
      s: "Death-spot predictions are taken straight from chat and decided together with the streamer.",
      m: "Death-spot predictions are decided by a chat vote.",
      l: "Death-spot predictions are decided by a mass vote, and viewers predict the result in advance.",
    },
    continuity: "Log your challenge records in the ledger and beat them in the next stream.",
    cautions: "Chat delay makes it better not to add participation during sections that need full focus.",
  },
  "solo-oneblock-growth": {
    title: "Minecraft OneBlock Growth Series",
    appealText: "You watch a single block visibly grow into a full base.",
    howTo: [
      "In the first episode, start on a map with just one block.",
      "Set the next goal each episode and show what you achieved on screen.",
      "At the start of each episode, point out what changed since last time with a side-by-side view.",
      "At the end of each episode, take the next goal by vote.",
    ],
    by: {
      s: "The next goal is taken straight from chat and decided together with the streamer.",
      m: "The next goal is decided by a chat vote.",
      l: "The next goal is decided by a mass vote, and viewers predict the result in advance.",
    },
    continuity: "Collect the change screenshots from each episode into a growth record.",
    gamesText: "Minecraft",
    setup: "OneBlock map",
  },
  "solo-minecraft-labor-talk": {
    title: "Minecraft Solo Grind + Chat",
    appealText: "Your hands work while your mouth chats with viewers, like a radio you leave on.",
    howTo: [
      "Set up a simple repetitive task (mining, farming, and so on) and start.",
      "Read the stories and questions that come in through chat and keep the talk going.",
      "Each time a task wraps up, take a new topic from viewers.",
      "At the end of the stream, sum up today's talk in one line.",
    ],
    by: {
      s: "Chat stories and questions become your conversation partners.",
      m: "Pick the next topic by a chat vote.",
      l: "Pick the story with the most sympathy and talk about it.",
    },
    continuity: "Open a story corner on the channel board and keep it going every stream.",
    gamesText: "Minecraft",
  },
  "solo-roblox-viewer-server": {
    title: "Roblox Viewer Server",
    appealText: "The moments and conversations from playing on the same server as viewers become the stream itself.",
    howTo: [
      "At the start of the stream, explain how to join the server and the rules.",
      "Play through games with the viewers who joined and trade banter on the spot.",
      "Decide the next game each time one ends.",
      "Save the fun moments as clips.",
    ],
    by: {
      s: "Viewers join the server play directly.",
      m: "Server players are picked from viewers who signed up in advance.",
    },
    cautions: "The stream only works if viewers join in. Avoid time slots when players will not show up.",
    gamesText: "Roblox (Murder Mystery 2, Tower of Hell, Dress to Impress, Doors)",
  },
  "solo-chat-integrated-play": {
    title: "Chat-Integrated Play (Crowd Control Style)",
    appealText: "The streamer's reactions to the trouble viewers throw at them are the main show.",
    howTo: [
      "Turn on the chat integration tool and tell chat which disruptions are possible.",
      "React on the spot to the disruptions viewers pick.",
      "As disruptions pile up, add or relax rules one at a time.",
      "Save the moment you got hit the hardest as a clip.",
    ],
    by: {
      s: "Chat is the disruption button.",
      m: "Pick disruptions by a chat vote.",
      l: "Pick the single strongest disruption by a mass vote.",
    },
    cautions: "You need an integration tool. Set how harsh the disruptions can get as a rule before the stream.",
    gamesText: "Games that support chat integration tools",
  },
  "solo-geoguessr-chat": {
    title: "GeoGuessr Chat Showdown",
    appealText: "The fun is in talking through your reasoning out loud.",
    howTo: [
      "Start a round and say your clues out loud.",
      "Chat members each pick an answer, then the majority picks one spot.",
      "Compare your answer with chat's and see who was closer.",
      "Add up the points each round, with the viewer team playing against the streamer.",
    ],
    by: {
      s: "Chat's majority vote is the viewer team's answer.",
      m: "Decide the viewer team's answer by vote.",
      l: "Bet on the mass vote result alongside a match prediction.",
    },
    gamesText: "GeoGuessr",
  },
  "solo-off-work-condition": {
    title: "Clock-Out Condition Stream",
    appealText: "The fun is in the venting and the chat debates over \"Can I clock out today?\"",
    howTo: [
      "At the start of the stream, set and reveal your clock-out condition (a viewer count goal, a donation mission, and so on).",
      "While you work toward it, keep things going with venting and small talk.",
      "Chat argues over whether to lower or raise the condition.",
      "Once the condition is met, show the clock-out finale.",
    ],
    by: {
      m: "Change the clock-out condition with donation missions or votes.",
      l: "Set today's condition with a mass vote and donation missions.",
    },
    borrowedFrom: "2 Days & 1 Night (Korea)",
  },
  "solo-saying-verification": {
    title: "Myth-Busting Stream",
    appealText: "The talk around each hypothesis is the main part, and the verdict is shown with a short visual moment.",
    howTo: [
      "Pick today's hypothesis from the myths collected on the channel board.",
      "Talk about whether it is true or false and trade opinions with viewers.",
      "If it can be tried, give it a short demo and rule on it.",
      "Wrap up the verdict and take the next hypothesis.",
    ],
    by: {
      m: "Collect the myths viewers want checked on the fan cafe (community board) and channel board in advance.",
      l: "Pick from the myths viewers want checked by lottery or vote and cover them on stream.",
    },
    cautions: "You need a community for hypotheses to come in.",
    borrowedFrom: "Downtown's Wednesday show (Japan)",
  },
  "solo-viewer-made-course": {
    title: "Playing Viewer-Made Courses and Maps",
    appealText: "The highlight is the moment a viewer's creation is shown for the first time.",
    howTo: [
      "Run a submission call on the fan cafe (community board) and gather entries on the deadline.",
      "On stream, call out the creator's nickname and play the work for the first time.",
      "Say what you feel as you play, and answer the creator in chat.",
      "At the end, pick today's best work by viewer vote.",
    ],
    by: {
      m: "Collect works in advance on the fan cafe (community board) and channel board.",
      l: "Pick from the works by lottery or vote and cover them on stream.",
    },
    continuity: "Turn it into a contest season.",
    cautions: "The stream does not work if no entries come in. Promote it before the deadline.",
    gamesText: "Super Mario Maker 2, Minecraft maps, Roblox obbies, Escape Simulator",
  },
  "solo-viewer-settlers": {
    title: "Viewer-Named Settlers",
    appealText: "The fun is in talking about the fate of characters named after viewers.",
    howTo: [
      "Take sign-ups on the channel board and create characters with viewers' nicknames.",
      "Tell each episode what happened to the characters as a story.",
      "At big forks in the story, ask the character's owner (the viewer) first.",
      "At the end of each episode, sum up how each character is doing in one line.",
    ],
    by: {
      m: "Collect character sign-ups in advance on the fan cafe (community board) and channel board.",
      l: "Pick from the character sign-ups by lottery or vote and cover them on stream.",
    },
    continuity: "Post the characters' updates on the channel board to fill the gaps between streams.",
    gamesText: "RimWorld, The Sims, Project Zomboid",
  },

  // ───── B. Small collabs ─────
  "small-minecraft-boss-raid": {
    title: "Minecraft Gear Upgrades and Boss Raids",
    appealText: "You can see at a glance the gear getting stronger and the bosses going down.",
    howTo: [
      "Everyone joins the same server with the boss-adding modpack.",
      "Split each episode into a farming section for upgrading gear and a boss challenge section.",
      "In boss fights, assign roles (damage, defense, support) and everyone streams from their own channel.",
      "Save the moment the boss falls as a clip and post it as Shorts.",
    ],
    multiPov: "Gear upgrade status and health show only on each member's own screen, so you have to call them out to each other to line up the plan.",
    by: {
      s: "The order of attack is taken straight from chat and decided together with the streamer.",
      m: "The order of attack is decided by a chat vote.",
      l: "The order of attack is decided by a mass vote, and viewers predict the result in advance.",
    },
    continuity: SEASON,
    gamesText: "Minecraft",
    setup: "Modpack that adds bosses",
  },
  "small-minecraft-labor": {
    title: "Minecraft Mining, Fishing, and Farming Grind Collab",
    appealText: "Simple chores play in the background while the members' chemistry and talk take the lead.",
    howTo: [
      "Decide each person's job (mining, fishing, farming) and start on the same server.",
      "While you work, keep up the talk about recent life, worries, and small talk.",
      "Toss in topics from chat so the conversation never stalls.",
      "At the end, check together how much the work added up to.",
    ],
    multiPov: "The same conversation plays on each member's stream with a different screen (task), so viewers can leave on whichever view they like.",
    by: {
      s: "Talk right away about topics tossed in from chat.",
      m: "Pick the next conversation topic by a chat vote.",
      l: "Pick the topic with the most sympathy and talk about it.",
    },
    gamesText: "Minecraft",
    setup: "Vanilla or Simple Voice Chat",
  },
  "small-asymmetric-coop": {
    title: "Asymmetric-Information Co-op",
    appealText: "It only works if you talk, so the communication itself is the content.",
    howTo: [
      "Explain the rule that every member starts with different information.",
      "Everyone streams from their own channel and passes on only what they can see, in words, to solve the puzzle.",
      "When you get stuck, say out loud who has which information.",
      "After clearing or failing, look back at what each person could see from their side.",
    ],
    multiPov: "Each member sees different information, so viewers only know one person's side. You have to switch to another member's stream to piece the puzzle together.",
    by: {
      s: "The role split for the next attempt is taken straight from chat and decided together with the streamer.",
      m: "The role split for the next attempt is decided by a chat vote.",
      l: "The role split for the next attempt is decided by a mass vote, and viewers predict the result in advance.",
    },
    cautions: "If viewers explain the manual, chat delay can break fairness.",
    gamesText: "BOMBANANA!, We Were Here, Keep Talking and Nobody Explodes",
  },
  "small-proximity-voice-horror": {
    title: "Proximity Voice Horror",
    appealText: "Screams and disappearances are caught differently from each member's point of view.",
    howTo: [
      "Turn on proximity voice and everyone starts streaming from their own channel.",
      "Show, on each person's screen, the moment someone vanishes after you split up to explore.",
      "The surviving members narrate the situation and regroup.",
      "Save the biggest scare as a clip.",
    ],
    multiPov: "The same incident sounds and looks different for each member, so viewers hop between streams to piece it together.",
    by: {
      s: "Who survives is taken straight from chat and decided together with the streamer.",
      m: "Who survives is decided by a chat vote.",
      l: "Who survives is decided by a mass vote, and viewers predict the result in advance.",
    },
    cautions: "It has horror elements. Not recommended for streamers who avoid horror.",
    gamesText: "Lethal Company, R.E.P.O., Content Warning, Phasmophobia, Escape From Playtime",
  },
  "small-physics-coop-conflict": {
    title: "Physics Co-op Blame Game",
    appealText: "The back-and-forth of blame and apologies is the core, with things like falls as short visual moments.",
    howTo: [
      "Explain the rule that you climb the same course together.",
      "Every time someone slips up, argue on the spot about whose fault it was.",
      "When the course ends, chat votes for \"today's culprit.\"",
      "Save the falling scenes as clips and post them as Shorts.",
    ],
    multiPov: "The same incident looks different to each member, so everyone comes up with different excuses.",
    by: {
      s: "Today's culprit is taken straight from chat and decided together with the streamer.",
      m: "Today's culprit is decided by a chat vote.",
      l: "Today's culprit is decided by a mass vote, and viewers predict the result in advance.",
    },
    gamesText: "Chained Together, PEAK, Overcooked 2",
  },
  "small-competitive-party": {
    title: "Competitive Party Night",
    appealText: "Last-minute comebacks and betrayal lines all explode at once.",
    howTo: [
      "Set the win-and-loss and penalty rules at the start of the stream.",
      "Each round, keep each other in check and trade alliances and betrayals in words.",
      "Show the comeback moments through each person's screen and reaction.",
      "At the end, sum up the rankings and the penalty.",
    ],
    multiPov: "Each member can see different information, so the talk is full of people fooling and being fooled.",
    by: {
      s: "Predictions for the winner are taken straight from chat and decided together with the streamer.",
      m: "Predictions for the winner are decided by a chat vote.",
      l: "Predictions for the winner are decided by a mass vote, and viewers predict the result in advance.",
    },
    gamesText: "Mario Party, Mario Kart, Liar's Bar",
  },
  "small-minecraft-manhunt": {
    title: "Minecraft Manhunt",
    appealText: "The chase and the narrow escapes are the core.",
    howTo: [
      "Split into runners and hunters and turn on the manhunt plugin.",
      "Hunters chase the runners with a tracking tool, and everyone streams from their own channel.",
      "Take turns narrating scenes from the runner's view and the hunter's view.",
      "Save the moment the chase is settled as a clip.",
    ],
    multiPov: "Runners and hunters know each other's positions differently, so viewers feel the tension by switching between both streams.",
    by: {
      s: "Which side to cheer for is taken straight from chat and decided together with the streamer.",
      m: "Which side to cheer for is decided by a chat vote.",
      l: "Which side to cheer for is decided by a mass vote, and viewers predict the result in advance.",
    },
    gamesText: "Minecraft",
    setup: "Manhunt plugin",
  },
  "small-simultaneous-task-contest": {
    title: "Simultaneous Stream Task Contest",
    appealText: "While doing the tasks it is visual fun, and at the collab judging, the excuses and roasting add audio fun.",
    howTo: [
      "Give every member the same task and have them do it at the same time, each from their own channel.",
      "After collecting the results, gather in a collab stream and judge each other's work.",
      "Trade excuses and roasts during the judging.",
      "Add up the viewer votes from each stream to set the final ranking.",
    ],
    multiPov: "The tasks show only on each member's own stream, and the other members' results are revealed for the first time at the collab judging.",
    by: {
      s: "Chat acts as the judges and gives scores.",
      m: "Add up the votes from each stream.",
      l: "Add up the mass votes from each stream to set the ranking.",
    },
    borrowedFrom: "Taskmaster (UK)",
  },
  "small-multi-pov-secret-mission": {
    title: "Multi-POV Secret Missions",
    appealText: "The core is the skill of steering others with words, and the tension of almost getting caught.",
    howTo: [
      "Secret missions issued through donations are revealed only on each member's own stream.",
      "Steer the conversation naturally so you can finish the mission without being caught.",
      "The other members guess and call out who got a mission.",
      "At the end, reveal everyone's missions and see who succeeded.",
    ],
    multiPov: "A secret mission shows only on that member's stream, so viewers watch while knowing something \"the other members don't know.\"",
    by: {
      m: "Issue missions to members through donations.",
      l: "Decide the missions with donation missions and a mass vote.",
    },
    cautions: "It only works with donation missions. Set how harsh the missions can get before the stream.",
    borrowedFrom: "Running Man spy race (Korea)",
  },
  "small-donation-roulette": {
    title: "Donation Roulette Penalty Game",
    appealText: "The fun is in the sense of injustice and the piling-on in front of a penalty.",
    howTo: [
      "Reveal the roulette slots (penalties and perks) at the start of the stream.",
      "When a donation comes in, spin the roulette to pick the target member.",
      "Keep going with the picked member's reaction and the other members piling on.",
      "At the end of the stream, carry out the penalty and wrap up the result.",
    ],
    multiPov: "Vary the order in which each stream announces the roulette result, so viewers get curious about the reactions on other streams.",
    by: {
      m: "Spin the roulette with donations.",
      l: "Decide the penalty with a donation roulette and a mass vote.",
    },
    borrowedFrom: "2 Days & 1 Night (Korea)",
  },
  "small-fandom-battle": {
    title: "Fandom Face-Off",
    appealText: "The core is a war of words with each fandom's pride on the line.",
    howTo: [
      "Collect pre-stream assignments (brag points and questions) on the fan cafe (community board).",
      "On stream, have each fandom argue using the assignments it collected.",
      "Each member represents their own fandom, making claims and rebutting the other side.",
      "At the end, pick the winner by viewer vote.",
    ],
    multiPov: "Each member's stream is where their own fandom's cheering gathers, so the same match feels different on every stream.",
    by: {
      m: "Collect fandom assignments in advance on the fan cafe and channel board.",
      l: "Pick from the fandom assignments by lottery or vote and cover them on stream.",
    },
    cautions: "You need a community for it to work. Set rules so it does not turn into excessive mudslinging.",
  },

  // ───── C. Big collabs ─────
  "large-small-game-league": {
    title: "Turning a Small Game into a League",
    appealText: "You get the fun of comparing each team's communication style, along with the clear moments.",
    howTo: [
      "Split a fixed-player-count game into teams and compete on records under the same conditions.",
      "Each team streams from its own channel and logs its clear record.",
      "Teams cannot watch each other's streams, and the records are revealed at the end.",
      "Compare the difference in each team's communication style through highlights.",
    ],
    multiPov: "The same match is shown on a different stream for each team, so viewers gather around the team they cheer for.",
    by: {
      s: "Which team to cheer for and the record predictions are taken straight from chat and decided together with the streamer.",
      m: "Which team to cheer for and the record predictions are decided by a chat vote.",
      l: "Which team to cheer for and the record predictions are decided by a mass vote, and viewers predict the result in advance.",
    },
    cautions: "You need several teams. If the game has a fixed player count, team sizes must match exactly.",
    gamesText: "BOMBANANA! team record matches, etc.",
  },
  "large-minecraft-life-server": {
    title: "Minecraft Limited-Lives Survival Server",
    appealText: "Alliance-building negotiation talks and fights alternate.",
    howTo: [
      "Set each participant's number of lives and open a server with the season rules applied.",
      "Everyone streams from their own channel and keeps up the negotiations to make and break alliances.",
      "Narrate lives-on-the-line fights from the involved participant's view.",
      "Each time someone is eliminated, sum up how the game stands.",
    ],
    multiPov: "Alliance talks are heard only on the involved participants' streams, so viewers hop between streams to piece together how the game stands.",
    by: {
      s: "Elimination predictions are taken straight from chat and decided together with the streamer.",
      m: "Elimination predictions are decided by a chat vote.",
      l: "Elimination predictions are decided by a mass vote, and viewers predict the result in advance.",
    },
    continuity: SEASON,
    borrowedFrom: "Life Series (Grian)",
    gamesText: "Minecraft",
    setup: "Season rules plugin and datapack",
  },
  "large-minecraft-team-shuffle-league": {
    title: "Minecraft Team-Shuffle Minigame League",
    appealText: "Flashy minigame play and ranking swings are visible at a glance.",
    howTo: [
      "Reshuffle the teams for every event.",
      "Reveal the running standings after each event.",
      "Take turns narrating each event's highlights on each person's own stream.",
      "Before the last event, sum up the standings and set up the final matchup.",
    ],
    multiPov: "Teams change every event, so viewers follow the members they cheer for from stream to stream.",
    by: {
      s: "The next event is taken straight from chat and decided together with the streamer.",
      m: "The next event is decided by a chat vote.",
      l: "The next event is decided by a mass vote, and viewers predict the result in advance.",
    },
    borrowedFrom: "Minecraft Championship",
    gamesText: "Minecraft",
  },
  "large-minecraft-mass-build": {
    title: "Minecraft Mass Group Build",
    appealText: "The highlight is the moment the result dozens of people made is revealed.",
    howTo: [
      "Set the build theme, split it into zones, and assign them to participants.",
      "Everyone streams from their own channel, builds their zone, and shares progress.",
      "When finished, everyone gathers on one stream to reveal the whole result for the first time.",
      "Wrap up with a review from a panel of viewers.",
    ],
    multiPov: "The building process for each zone is split across each person's stream, and the whole picture is revealed all at once at the final reveal.",
    by: {
      s: "A few viewers become the judging panel.",
      m: "Judge by viewer vote.",
      l: "Judge by mass vote.",
    },
    gamesText: "Minecraft",
  },
  "large-minecraft-mass-labor-server": {
    title: "Minecraft Big Grind Server (Village Economy and More)",
    appealText: "Chatter and trading going on all over the place flow together like a radio.",
    howTo: [
      "Set the village economy rules (jobs, how to trade) and open the server.",
      "Participants each stream from their own channel, work, and trade with each other.",
      "Viewers hop between streams, listening to the ones they like.",
      "At the end of the day, sum up the village economy.",
    ],
    multiPov: "Conversations from all over the village play separately on each stream, so viewers hop between streams to gather the stories.",
    by: {
      s: "Hopping between streams to watch and listen is itself the participation.",
    },
    cautions: "Participation here comes through how viewers watch, not through chat.",
    gamesText: "Minecraft",
  },
  "large-roleplay-server": {
    title: "Roleplay Server (GTA5, Minecraft)",
    appealText: "The core is acting in character and the conversations that build relationships.",
    howTo: [
      "Announce the server's world and rules, and decide a character for each participant.",
      "Everyone streams from their own channel and talks while living as their character.",
      "When an incident happens, show the scene on the related characters' streams.",
      "Viewers pick and follow the stream of whichever character they are curious about.",
    ],
    multiPov: "One incident appears from different angles on several characters' streams, so viewers watch multiple streams to put the whole picture together.",
    by: {
      s: "Finding and watching other points of view is itself the participation.",
    },
    borrowedFrom: "NoPixel (US), Sutogura (Japan)",
    gamesText: "GTA5, Minecraft",
  },
  "large-social-deduction": {
    title: "Social Deduction",
    appealText: "It is a battle of wits with defenses, pile-ons, and lies.",
    howTo: [
      "Roles are assigned in secret and everyone starts streaming from their own channel.",
      "In meetings, suspect each other, defend yourself, and gather opinions.",
      "Right before the vote, call out the most suspicious participant.",
      "When a round ends, reveal the hidden roles and look back.",
    ],
    multiPov: "Everyone knows their own secret role, so viewers watch the lies with different information on each stream.",
    by: {
      s: "Predictions for the culprit are taken straight from chat and decided together with the streamer.",
      m: "Predictions for the culprit are decided by a chat vote.",
      l: "Predictions for the culprit are decided by a mass vote, and viewers predict the result in advance.",
    },
    cautions: "If viewers find out roles on other streams and tell people, the round can fall apart. Set a spoiler rule.",
    gamesText: "Goose Goose Duck, Among Us",
  },
  "large-mass-coop-horror": {
    title: "Big-Group Co-op Horror",
    appealText: "Many people's screams sound different from each point of view.",
    howTo: [
      "Everyone enters the same match and starts streaming from their own channel.",
      "While exploring, narrate who gets caught first and who survives.",
      "Whoever survives sums up the situation and leads the remaining members.",
      "Save the scary moments as clips and post them as Shorts.",
    ],
    multiPov: "The screams of many people sound different on each stream, so viewers hop between streams to piece the situation together.",
    by: {
      s: "Survivor predictions are taken straight from chat and decided together with the streamer.",
      m: "Survivor predictions are decided by a chat vote.",
      l: "Survivor predictions are decided by a mass vote, and viewers predict the result in advance.",
    },
    cautions: "It has horror elements. The game is new, so its hype window may be short. Once the hype passes, drop it down to a single episode of your regular content.",
    gamesText: "Escape From Playtime, etc.",
  },
  "large-draft-tournament": {
    title: "Draft Tournament",
    appealText: "The draft is audio fun, with evaluations and humiliation flying around, and the main event is visual fun.",
    howTo: [
      "Run a draft on stream where team captains take turns picking teammates.",
      "Rate and tease each other over the pick order and the reasons.",
      "In the main event, each team streams from its own channel and plays its matches.",
      "Before the matches, predict the winning team with viewers.",
    ],
    multiPov: "What the captains say to each other during the draft comes out in different tones on each stream, so viewers have fun comparing.",
    by: {
      s: "Predictions for the winning team are taken straight from chat and decided together with the streamer.",
      m: "Predictions for the winning team are decided by a chat vote.",
      l: "Predictions for the winning team are decided by a mass vote, and viewers predict the result in advance.",
    },
  },
  "large-secret-talk-survival": {
    title: "Secret-Talk Streaming Survival",
    appealText: "Secret talks are heard only on the involved participants' streams, so there is the fun of piecing the puzzle together.",
    howTo: [
      "Set times when participants hold secret conversations with each other.",
      "Secret talks can be heard only on those participants' streams.",
      "After each round, in the open debate, make claims about what you heard in the secret talks.",
      "Judge whose claims were true and decide who is eliminated.",
    ],
    multiPov: "Secret talks are heard only on the involved participants' streams, so viewers hop between streams to work out the truth.",
    by: {
      s: "Hopping between streams to collect and listen to the secret talks is itself the participation.",
    },
    borrowedFrom: "The Genius (Korea)",
  },
  "large-hunter-chase-event": {
    title: "Hunter Chase Event",
    appealText: "The chase and the narrow escapes are the core.",
    howTo: [
      "Decide the runner and hunter roles and announce the time limit rule.",
      "Everyone streams from their own channel, with runners hiding and hunters chasing.",
      "A participant caught by a hunter is eliminated and narrates from their own point of view.",
      "Right before time runs out, put surrender pressure on with a viewer vote.",
    ],
    multiPov: "Runners do not know where the hunters are, while viewers hop between both streams and know both sides.",
    by: {
      s: "Surrender pressure is taken straight from chat and decided together with the streamer.",
      m: "Surrender pressure is decided by a chat vote.",
      l: "Surrender pressure is decided by a mass vote, and viewers predict the result in advance.",
    },
    borrowedFrom: "Run for Money / Tōsōchū (Japan)",
  },
  "large-viewer-server-event": {
    title: "Viewer-Participation Server Event",
    appealText: "The core is the scene of streamers and viewers playing as one team.",
    howTo: [
      "Take sign-ups on the fan cafe (community board) and pick participants by lottery.",
      "Selected viewers join the same server as the streamer and become teammates.",
      "Everyone streams from their own channel, and you call out the viewer participants' nicknames.",
      "After the event, collect the participants' impressions and introduce them on stream.",
    ],
    multiPov: "Participating viewers can also join by streaming from their own screens, so one scene can be seen from several points of view.",
    by: {
      m: "Take sign-ups on the fan cafe.",
      l: "Pick the representative participants by lottery from the applicants.",
    },
    cautions: "You need participants for it to work. Announce the rules for running it safely first.",
  },
};
