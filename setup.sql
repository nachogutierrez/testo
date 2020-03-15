CREATE DATABASE testo;

CREATE TABLE workload (
  id serial PRIMARY KEY,
  skip integer not null,
  pass integer not null,
  total integer not null,
  duration integer not null,
  kind varchar(128) not null,
  created_at timestamp default current_timestamp
);

CREATE TABLE workload_metadata (
  workload_id integer not null,
  key varchar(64) not null,
  value varchar(128) not null,
  created_at timestamp default current_timestamp,
  PRIMARY KEY (workload_id, key),
  FOREIGN KEY (workload_id) REFERENCES workload (id) ON DELETE CASCADE
);

CREATE TYPE status AS ENUM ('fail', 'skip', 'pass');
CREATE TABLE result (
  id serial PRIMARY KEY,
  workload_id integer not null,
  status status not null,
  duration integer not null,
  kind varchar(128) not null,
  created_at timestamp default current_timestamp,
  FOREIGN KEY (workload_id) REFERENCES workload (id) ON DELETE CASCADE
);

CREATE TABLE result_metadata (
  result_id integer not null,
  key varchar(64) not null,
  value varchar(128) not null,
  created_at timestamp default current_timestamp,
  PRIMARY KEY (result_id, key),
  FOREIGN KEY (result_id) REFERENCES result (id) ON DELETE CASCADE
);

-- last occurrence of failure for result of kind 'abc123'
select * from result
where kind = 'abc123' and status = 'fail'
order by created_at desc
limit 1;

-- average duration (last 100 executions) of result of kind 'abc123'
select avg(duration) from result
where kind = 'abc123'
order by created_at desc
limit 100;
