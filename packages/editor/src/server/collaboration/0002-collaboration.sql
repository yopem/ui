CREATE TABLE editor_collaboration_heads(
 document_id TEXT PRIMARY KEY REFERENCES editor_documents(document_id),
 generation TEXT NOT NULL REFERENCES editor_generations(generation),
 revision BIGINT NOT NULL CHECK(revision BETWEEN 2 AND 9223372036854775807),
 state BYTEA NOT NULL CHECK(octet_length(state) BETWEEN 2 AND 61440)
);
CREATE TABLE editor_collaboration_updates(
 document_id TEXT NOT NULL REFERENCES editor_documents(document_id),
 generation TEXT NOT NULL REFERENCES editor_generations(generation),
 revision BIGINT NOT NULL CHECK(revision BETWEEN 3 AND 9223372036854775807),
 base_revision BIGINT NOT NULL CHECK(base_revision BETWEEN 2 AND 9223372036854775806),
 operation_id TEXT NOT NULL CHECK(length(operation_id) BETWEEN 16 AND 128),
 digest TEXT NOT NULL CHECK(length(digest)=64),
 update_bytes BYTEA NOT NULL CHECK(octet_length(update_bytes) BETWEEN 2 AND 61440),
 PRIMARY KEY(document_id,generation,revision),
 UNIQUE(document_id,generation,operation_id)
);
