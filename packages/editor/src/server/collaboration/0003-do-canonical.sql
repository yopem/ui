CREATE TABLE editor_do_bootstrap(
 document_id TEXT PRIMARY KEY REFERENCES editor_documents(document_id),
 generation TEXT NOT NULL CHECK(length(generation)=64),
 coordinator_id TEXT NOT NULL CHECK(length(coordinator_id)=64),
 revision TEXT NOT NULL,
 seed BLOB NOT NULL CHECK(length(seed) BETWEEN 2 AND 61440),
 phase TEXT NOT NULL CHECK(phase IN ('prepared','active'))
);
CREATE TRIGGER editor_do_document_update BEFORE UPDATE ON editor_documents
WHEN OLD.mode='yjs' AND EXISTS(SELECT 1 FROM editor_do_bootstrap WHERE document_id=OLD.document_id)
BEGIN SELECT RAISE(ABORT,'collaboration lifecycle requires offline migration'); END;
CREATE TRIGGER editor_do_document_delete BEFORE DELETE ON editor_documents
WHEN EXISTS(SELECT 1 FROM editor_do_bootstrap WHERE document_id=OLD.document_id)
BEGIN SELECT RAISE(ABORT,'collaboration lifecycle requires offline migration'); END;
