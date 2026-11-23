CREATE TABLE friendships (
  low_id NUMBER NOT NULL REFERENCES app_users(id),
  high_id NUMBER NOT NULL REFERENCES app_users(id),
  sender_id NUMBER NOT NULL REFERENCES app_users(id),
  status VARCHAR2(8 CHAR) NOT NULL,
  CONSTRAINT friendships_pk PRIMARY KEY (low_id, high_id),
  CONSTRAINT friendships_order_ck CHECK (low_id < high_id),
  CONSTRAINT friendships_sender_ck CHECK (sender_id IN (low_id, high_id)),
  CONSTRAINT friendships_status_ck CHECK (status IN ('pending', 'accepted'))
);
CREATE INDEX friendships_high_ix ON friendships (high_id);
CREATE INDEX friendships_sender_ix ON friendships (sender_id);
