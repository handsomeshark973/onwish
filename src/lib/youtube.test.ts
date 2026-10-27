import assert from "node:assert/strict";
import test from "node:test";
import { channelIdFromUrl, extractYoutubeId } from "./youtube";
import { initialVideoStatus } from "./video-rules";

// 시험용 값: 실제 영상이 아니라 11자리 모양만 맞춘 글자
const ID = "abc_DEF-123";

test("영상 ID 추출: 여러 주소 모양", () => {
  assert.equal(extractYoutubeId(ID), ID);
  assert.equal(extractYoutubeId(`https://www.youtube.com/watch?v=${ID}&t=10s`), ID);
  assert.equal(extractYoutubeId(`youtu.be/${ID}?si=x`), ID);
  assert.equal(extractYoutubeId(`https://www.youtube.com/embed/${ID}`), ID);
  assert.equal(extractYoutubeId(`https://www.youtube.com/shorts/${ID}`), ID);
  assert.equal(extractYoutubeId(`https://m.youtube.com/watch?v=${ID}`), ID);
});

test("영상 ID 추출: 받지 않는 입력", () => {
  assert.equal(extractYoutubeId(""), null);
  assert.equal(extractYoutubeId("https://evil.example/watch?v=" + ID), null);
  assert.equal(extractYoutubeId("https://www.youtube.com/playlist?list=PLabc"), null);
  assert.equal(extractYoutubeId("https://www.youtube.com/@somechannel"), null);
  assert.equal(extractYoutubeId("https://www.youtube.com/watch?v=short"), null);
  assert.equal(extractYoutubeId("https://www.youtube.com.evil.example/watch?v=" + ID), null);
});

test("채널 ID: /channel/UC… 주소만 읽는다", () => {
  assert.equal(channelIdFromUrl("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv"), "UCabcdefghijklmnopqrstuv");
  assert.equal(channelIdFromUrl("https://www.youtube.com/@handle"), null);
  assert.equal(channelIdFromUrl(null), null);
});

test("공식 채널 허용 목록: 목록에 있을 때만 승인", () => {
  assert.equal(initialVideoStatus("UC1", ["UC1", "UC2"]), "approved");
  assert.equal(initialVideoStatus("UC9", ["UC1"]), "pending");
  assert.equal(initialVideoStatus(null, ["UC1"]), "pending");
  assert.equal(initialVideoStatus("UC1", []), "pending");
});
