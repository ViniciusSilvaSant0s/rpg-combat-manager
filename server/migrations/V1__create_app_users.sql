CREATE TABLE app_users (
  id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  firebase_uid VARCHAR2(128 CHAR) NOT NULL,
  email VARCHAR2(320 CHAR),
  display_name VARCHAR2(255 CHAR),
  nickname VARCHAR2(20 CHAR) NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT app_users_firebase_uid_uk UNIQUE (firebase_uid),
  CONSTRAINT app_users_nickname_ck CHECK (REGEXP_LIKE(nickname, '^[A-Za-z0-9_]{3,20}$', 'c'))
);
CREATE UNIQUE INDEX app_users_nickname_uk ON app_users (LOWER(nickname));
CREATE INDEX app_users_email_ix ON app_users (email);
