-- GTA VI를 한국어 화면에서도 영어 원본 이름(Grand Theft Auto VI)으로 보이게 한다. 이미 등록한 운영 DB에서 SQL 편집기로 실행한다.
-- 화면은 한국어 이름(name_ko)이 있으면 그것을, 없으면 원본(name)을 쓴다. 한국어 이름을 비우면 된다.
update games set name = 'Grand Theft Auto VI', name_ko = null where slug = 'grand-theft-auto-vi';
