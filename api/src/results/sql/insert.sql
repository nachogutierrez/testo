-- workloads
insert into workload (kind) values ('a');
insert into workload (kind) values ('a');
insert into workload (kind) values ('a');

-- workload metadata, assuming workload ids: [1, 2, 3]
insert into workload_metadata (workload_id, key, value) values (1, 'repository', 'https://github.com/some-org/some-repo');
insert into workload_metadata (workload_id, key, value) values (1, 'branch', 'master');
insert into workload_metadata (workload_id, key, value) values (1, 'commit', 'abc123');
insert into workload_metadata (workload_id, key, value) values (1, 'browser', 'chrome');
insert into workload_metadata (workload_id, key, value) values (1, 'jdk', '11');

insert into workload_metadata (workload_id, key, value) values (2, 'repository', 'https://github.com/some-org/some-repo');
insert into workload_metadata (workload_id, key, value) values (2, 'branch', 'master');
insert into workload_metadata (workload_id, key, value) values (2, 'commit', 'abc124');
insert into workload_metadata (workload_id, key, value) values (2, 'browser', 'safari');
insert into workload_metadata (workload_id, key, value) values (2, 'jdk', '11');

insert into workload_metadata (workload_id, key, value) values (3, 'repository', 'https://github.com/some-org/some-repo');
insert into workload_metadata (workload_id, key, value) values (3, 'branch', 'master');
insert into workload_metadata (workload_id, key, value) values (3, 'commit', 'abc125');
insert into workload_metadata (workload_id, key, value) values (3, 'browser', 'firefox');
insert into workload_metadata (workload_id, key, value) values (3, 'jdk', '8');

-- results
insert into result (workload_id, kind, status, duration) values (1, 'a1', 'pass', 150);
insert into result (workload_id, kind, status, duration) values (1, 'a2', 'pass', 217);
insert into result (workload_id, kind, status, duration) values (1, 'a3', 'pass', 943);

insert into result (workload_id, kind, status, duration) values (2, 'a1', 'pass', 165);
insert into result (workload_id, kind, status, duration) values (2, 'a2', 'pass', 204);
insert into result (workload_id, kind, status, duration) values (2, 'a3', 'fail', 796);

insert into result (workload_id, kind, status, duration) values (3, 'a1', 'fail', 512);
insert into result (workload_id, kind, status, duration) values (3, 'a2', 'pass', 220);
insert into result (workload_id, kind, status, duration) values (3, 'a3', 'pass', 823);

-- result metadata, assuming result ids: [1, ..., 9]
insert into result_metadata (result_id, key, value) values (1, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (1, 'method', 'someMagicTest_1');

insert into result_metadata (result_id, key, value) values (2, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (2, 'method', 'someMagicTest_2');

insert into result_metadata (result_id, key, value) values (3, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (3, 'method', 'someMagicTest_3');

insert into result_metadata (result_id, key, value) values (4, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (4, 'method', 'someMagicTest_1');

insert into result_metadata (result_id, key, value) values (5, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (5, 'method', 'someMagicTest_2');

insert into result_metadata (result_id, key, value) values (6, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (6, 'method', 'someMagicTest_3');

insert into result_metadata (result_id, key, value) values (7, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (7, 'method', 'someMagicTest_1');

insert into result_metadata (result_id, key, value) values (8, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (8, 'method', 'someMagicTest_2');

insert into result_metadata (result_id, key, value) values (9, 'class', 'MagicTest');
insert into result_metadata (result_id, key, value) values (9, 'method', 'someMagicTest_3');
