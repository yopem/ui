CREATE TABLE editor_collaboration_tickets(
 token TEXT PRIMARY KEY CHECK(token ~ '^[a-f0-9]{64}$'),
 document_id TEXT NOT NULL CHECK(length(document_id) BETWEEN 3 AND 256 AND document_id ~ '^[A-Za-z0-9][A-Za-z0-9/_:.-]*$'),
 generation TEXT NOT NULL CHECK(generation ~ '^[a-f0-9]{64}$'),
 provider TEXT NOT NULL CHECK(provider IN ('openauth','better-auth')),
 user_id TEXT NOT NULL CHECK(length(user_id) BETWEEN 1 AND 256 AND length(btrim(user_id)) > 0),
 permission TEXT NOT NULL CHECK(permission IN ('read','write')),
 credential_expires_at BIGINT NOT NULL CHECK(credential_expires_at > 0),
 expires_at BIGINT NOT NULL CHECK(expires_at > 0 AND expires_at <= credential_expires_at)
);
CREATE INDEX editor_collaboration_tickets_expiry ON editor_collaboration_tickets(expires_at);
CREATE TABLE editor_collaboration_clients(
 document_id TEXT NOT NULL CHECK(length(document_id) BETWEEN 3 AND 256 AND document_id ~ '^[A-Za-z0-9][A-Za-z0-9/_:.-]*$'),
 generation TEXT NOT NULL CHECK(generation ~ '^[a-f0-9]{64}$'),
 client_id BIGINT NOT NULL CHECK(client_id BETWEEN 0 AND 4294967295),
 lease_id TEXT NOT NULL UNIQUE CHECK(lease_id ~ '^[a-f0-9]{32}$'),
 expires_at BIGINT NOT NULL CHECK(expires_at > 0),
 PRIMARY KEY(document_id,generation,client_id)
);
CREATE INDEX editor_collaboration_clients_expiry ON editor_collaboration_clients(expires_at);
CREATE SEQUENCE editor_collaboration_presence_revision_seq;
CREATE TABLE editor_collaboration_presence(
 document_id TEXT NOT NULL CHECK(length(document_id) BETWEEN 3 AND 256 AND document_id ~ '^[A-Za-z0-9][A-Za-z0-9/_:.-]*$'),
 generation TEXT NOT NULL CHECK(generation ~ '^[a-f0-9]{64}$'),
 client_id BIGINT NOT NULL CHECK(client_id BETWEEN 0 AND 4294967295),
 lease_id TEXT NOT NULL CHECK(lease_id ~ '^[a-f0-9]{32}$'),
 user_id TEXT NOT NULL CHECK(length(user_id) BETWEEN 1 AND 256 AND length(btrim(user_id)) > 0),
 clock BIGINT NOT NULL CHECK(clock BETWEEN 1 AND 4294967295),
 payload BYTEA NOT NULL CHECK(octet_length(payload) BETWEEN 2 AND 4096),
 revision BIGINT NOT NULL DEFAULT nextval('editor_collaboration_presence_revision_seq') CHECK(revision > 0),
 active BOOLEAN NOT NULL,
 expires_at BIGINT NOT NULL CHECK(expires_at > 0),
 PRIMARY KEY(document_id,generation,client_id)
);
CREATE INDEX editor_collaboration_presence_revision ON editor_collaboration_presence(document_id,generation,revision);
CREATE INDEX editor_collaboration_presence_expiry ON editor_collaboration_presence(expires_at);
