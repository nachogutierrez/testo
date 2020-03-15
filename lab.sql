-- TABLES
CREATE TABLE result (
  id serial PRIMARY KEY,
  created_at timestamp default current_timestamp
);

CREATE TABLE result_metadata (
  result_id integer not null,
  key varchar(64) not null,
  value varchar(128) not null,
  created_at timestamp default current_timestamp,
  PRIMARY KEY (result_id, key),
  FOREIGN KEY (result_id) REFERENCES result (id) ON DELETE CASCADE
);

-- QUERIES
SELECT r.id, count(*) as amount FROM result as r
INNER JOIN result_metadata as rm on r.id = rm.result_id
GROUP BY r.id
HAVING rm.key = 'group_name' AND rm.value = 'Class A'
ORDER BY r.id;

(SELECT result_id FROM result_metadata
WHERE key = 'build_name' AND value = 'Express')
INTERSECT
(SELECT result_id FROM result_metadata
WHERE key = 'job_name' AND value = 'Test Runner')
INTERSECT
(SELECT result_id FROM result_metadata
WHERE key = 'group_name' AND value = 'Class A')
INTERSECT
(SELECT result_id FROM result_metadata
WHERE key = 'result_name' AND value = 'Method A')
ORDER BY result_id;

-- select all result ids for the same (build_name, job_name, group_name, result_name)
SELECT rm_a.result_id, rm_a.value, rm_b.value, rm_c.value, rm_d.value FROM result_metadata as rm_a
INNER JOIN result_metadata AS rm_b ON rm_a.result_id = rm_b.result_id
INNER JOIN result_metadata AS rm_c ON rm_a.result_id = rm_c.result_id
INNER JOIN result_metadata AS rm_d ON rm_a.result_id = rm_d.result_id
WHERE rm_a.key = 'build_name' AND rm_a.value = 'Express'
AND rm_b.key = 'job_name' AND rm_b.value = 'Test Runner'
AND rm_c.key = 'group_name' AND rm_c.value = 'Class A'
AND rm_d.key = 'result_name' AND rm_d.value = 'Method A'

select result_id,
max(case when key = 'build_name' then value end) as build,
max(case when key = 'job_name' then value end) as job,
max(case when key = 'group_name' then value end) as group,
max(case when key = 'result_name' then value end) as result
from result_metadata
group by result_id
having max(case when key = 'result_name' then value end) = 'Method B'
and max(case when key = 'group_name' then value end) = 'Class A'
order by result_id

select rm.result_id,
max(r.created_at) as created_at,
max(case when rm.key = 'build_name' then rm.value end) as build
from result_metadata as rm inner join result as r on rm.result_id = r.id
where r.created_at >= '2020-02-22'
group by rm.result_id
having max(case when rm.key = 'build_name' then rm.value end) = 'Express'
and max(case when rm.key = 'job_name' then rm.value end) = 'Test Runner'
and max(case when rm.key = 'group_name' then rm.value end) = 'Class A'
order by rm.result_id

SELECT rm_a.result_id, rm_a.key, rm_a.value FROM result_metadata as rm_a
WHERE rm_a.key = 'build_name' AND rm_a.value = 'Express'

-- INSERTIONS
INSERT INTO result default values;
INSERT INTO result_metadata(result_id, key, value) values (1, 'build_name', 'Express');
INSERT INTO result_metadata(result_id, key, value) values (1, 'job_name', 'Test Runner');
INSERT INTO result_metadata(result_id, key, value) values (1, 'group_name', 'Class A');
INSERT INTO result_metadata(result_id, key, value) values (1, 'result_name', 'Method A');

INSERT INTO result_metadata(result_id, key, value) values (2, 'build_name', 'Express');
INSERT INTO result_metadata(result_id, key, value) values (2, 'job_name', 'Test Runner');
INSERT INTO result_metadata(result_id, key, value) values (2, 'group_name', 'Class A');
INSERT INTO result_metadata(result_id, key, value) values (2, 'result_name', 'Method B');

INSERT INTO result_metadata(result_id, key, value) values (3, 'build_name', 'Express');
INSERT INTO result_metadata(result_id, key, value) values (3, 'job_name', 'Test Runner');
INSERT INTO result_metadata(result_id, key, value) values (3, 'group_name', 'Class B');
INSERT INTO result_metadata(result_id, key, value) values (3, 'result_name', 'Method A');

INSERT INTO result_metadata(result_id, key, value) values (4, 'build_name', 'Express');
INSERT INTO result_metadata(result_id, key, value) values (4, 'job_name', 'Test Runner');
INSERT INTO result_metadata(result_id, key, value) values (4, 'group_name', 'Class C');
INSERT INTO result_metadata(result_id, key, value) values (4, 'result_name', 'Method A');

INSERT INTO result_metadata(result_id, key, value) values (5, 'build_name', 'Express');
INSERT INTO result_metadata(result_id, key, value) values (5, 'job_name', 'Test Runner');
INSERT INTO result_metadata(result_id, key, value) values (5, 'group_name', 'Class A');
INSERT INTO result_metadata(result_id, key, value) values (5, 'result_name', 'Method A');
