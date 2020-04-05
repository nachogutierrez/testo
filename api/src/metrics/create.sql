create database metrics;

create table datapoint (
  name varchar(128) not null,
  time timestamp NOT NULL DEFAULT NOW(),
  value integer not null
);
