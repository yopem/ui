CREATE TABLE editor_snapshot_migrations(version INTEGER PRIMARY KEY CHECK(version=1));
CREATE TABLE editor_documents(
 document_id TEXT PRIMARY KEY CHECK(length(document_id) BETWEEN 3 AND 256),
 generation TEXT NOT NULL CHECK(length(generation)=64),
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 9223372036854775807),
 mode TEXT NOT NULL CHECK(mode IN ('snapshot','yjs')),
 state_json TEXT CHECK(length(state_json)<=1048576),
 schema_version INTEGER NOT NULL CHECK(schema_version BETWEEN 1 AND 2147483647),
 deleted INTEGER NOT NULL CHECK(deleted IN (0,1)),
 mutation_marker TEXT NOT NULL CHECK(length(mutation_marker)=64),
 CHECK((deleted=1 AND state_json IS NULL) OR (deleted=0 AND state_json IS NOT NULL))
);
CREATE TABLE editor_generations(
 generation TEXT PRIMARY KEY CHECK(length(generation)=64),
 document_id TEXT NOT NULL REFERENCES editor_documents(document_id)
);
CREATE TABLE editor_operations(
 document_id TEXT NOT NULL REFERENCES editor_documents(document_id),
 operation_id TEXT NOT NULL CHECK(length(operation_id) BETWEEN 16 AND 128),
 request_digest TEXT NOT NULL CHECK(length(request_digest)=64),
 generation TEXT NOT NULL REFERENCES editor_generations(generation),
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 9223372036854775807),
 mode TEXT NOT NULL CHECK(mode='snapshot'),
 state_json TEXT CHECK(length(state_json)<=1048576),
 schema_version INTEGER NOT NULL CHECK(schema_version BETWEEN 1 AND 2147483647),
 deleted INTEGER NOT NULL CHECK(deleted IN (0,1)),
 PRIMARY KEY(document_id,operation_id),
 CHECK((deleted=1 AND state_json IS NULL) OR (deleted=0 AND state_json IS NOT NULL))
);
INSERT INTO editor_snapshot_migrations(version) VALUES(1);
