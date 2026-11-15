CREATE TABLE combatants (
  id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES app_users(id),
  name VARCHAR2(255 CHAR) NOT NULL CHECK (TRIM(name) IS NOT NULL),
  type VARCHAR2(6 CHAR) NOT NULL CHECK (type IN ('player', 'npc')),
  character_id VARCHAR2(64 CHAR),
  maximum_hit_points NUMBER(10) NOT NULL CHECK (maximum_hit_points >= 0),
  armor_class NUMBER(10) NOT NULL CHECK (armor_class >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL
);
CREATE INDEX combatants_user_id_ix ON combatants (user_id);
