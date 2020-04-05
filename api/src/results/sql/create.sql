create database testo;

create table workload (
  id serial,
  kind varchar(128) not null,
  created_at timestamp default current_timestamp,
  primary key (id)
);

create table workload_metadata (
  workload_id integer references workload(id) on delete cascade,
  key varchar(128) not null,
  value varchar(512) not null,
  created_at timestamp default current_timestamp,
  primary key (workload_id, key)
);

CREATE TYPE status AS ENUM ('pass', 'fail', 'skip', 'error');
create table result (
  workload_id integer references workload(id) on delete cascade,
  id serial,
  kind varchar(128) not null,
  status status not null,
  duration integer not null,
  created_at timestamp default current_timestamp,
  primary key (id)
);

create table result_metadata (
  result_id integer references result(id) on delete cascade,
  key varchar(128) not null,
  value varchar(512) not null,
  created_at timestamp default current_timestamp,
  primary key (result_id, key)
);
