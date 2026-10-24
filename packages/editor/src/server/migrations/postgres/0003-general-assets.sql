ALTER TABLE editor_assets ADD COLUMN media_kind TEXT NOT NULL DEFAULT 'image';
ALTER TABLE editor_assets DROP CONSTRAINT editor_assets_media_type_check;
ALTER TABLE editor_assets ADD CHECK(length(media_type) BETWEEN 3 AND 127),ADD CHECK(media_kind IN ('image','audio','video','file')),ADD CHECK(media_kind<>'image' OR media_type IN ('image/png','image/jpeg','image/webp')),ADD CHECK(media_kind<>'audio' OR media_type IN ('audio/wav','audio/mpeg','audio/ogg')),ADD CHECK(media_kind<>'video' OR media_type IN ('video/webm','video/mp4'));
