# db-design
Class "db-design"

## LINK
- [Figma](https://www.figma.com/file/enWBMJb6aJAwdzu7ZWqQCz/MUDS.LINK?node-id=0%3A1)

## Postgresql
users
```SQL
CREATE TABLE users(
   id       VARCHAR(64) NOT NULL PRIMARY KEY
  ,password VARCHAR(128) NOT NULL
  ,key      VARCHAR(64) NOT NULL
  ,getpro   VARCHAR(64)
);

INSERT INTO users(id,password,key,getpro) VALUES ('admin','password','test_key',NULL);
INSERT INTO users(id,password,key,getpro) VALUES ('nokey_user','password','LP5lNxtoYSNE',NULL);
INSERT INTO users(id,password,key,getpro) VALUES ('test','password','0gsA-K4o&djf',NULL);
INSERT INTO users(id,password,key,getpro) VALUES ('test2','password','PmJOfzd2OSlH',NULL);
```
  
tasks
```SQL
CREATE TABLE tasks(
   task_id   VARCHAR(64) NOT NULL PRIMARY KEY
  ,user_id   VARCHAR(64) NOT NULL
  ,task_name VARCHAR(128) NOT NULL
  ,task_pro  VARCHAR(128) NOT NULL
  ,task_dead BIGINT  NOT NULL
  ,task_done BOOLEAN  NOT NULL
);
```
  
projects
```SQL
CREATE TABLE projects(
   pro_id  VARCHAR(64) NOT NULL PRIMARY KEY
  ,user_id VARCHAR(64) NOT NULL
  ,name    VARCHAR(64) NOT NULL
  ,share   BOOLEAN  NOT NULL
);
```