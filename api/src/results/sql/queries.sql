-- get workloads
select workload.id, workload.kind, workload.created_at from workload inner join workload_metadata on workload.id = workload_metadata.workload_id
where workload.kind = 'a' and workload.created_at > '2020-03-15' and workload.created_at < '2020-03-20'
group by workload.id
having max(case when workload_metadata.key = 'browser' then workload_metadata.value end) = 'chrome'
order by workload.created_at desc
limit 2
offset 0;

-- get results
select result.id, result.kind, result.status, result.duration, result.created_at
from result inner join result_metadata on result.id = result_metadata.result_id
where result.kind = 'a1' and result.created_at > '2020-03-15' and result.created_at < '2020-03-20' and result.status = 'pass'
group by result.id
having max(case when result_metadata.key = 'class' then result_metadata.value end) = 'MagicTest'
order by result.created_at desc
limit 2
offset 0;
