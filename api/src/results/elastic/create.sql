create database testo;

create table workload (
  id varchar(64),
  pass integer default 0,
  fail integer default 0,
  skip integer default 0,
  primary key (id)
);
