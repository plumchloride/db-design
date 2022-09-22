"""
A Sample Web-DB Application for DB-DESIGN lecture
Copyright (C) 2022 Yasuhiro Hayashi
"""
from psycopg2 import sql, connect, ProgrammingError
import flaskdb.var as v

class DataAccess:

    # Constractor called when this class is used. 
    # It is set for hostname, port, dbname, useranme and password as parameters.
    def __init__(self, hostname, port, dbname, username, password):
        self.dburl = "host=" + hostname + " port=" + str(port) + \
                     " dbname=" + dbname + " user=" + username + \
                     " password=" + password

    # This method is used to actually issue query sql to database. 
    def execute(self, query, autocommit=True):
        with connect(self.dburl) as conn:
            if v.SHOW_SQL:
                print(query.as_string(conn))
            conn.autocommit = autocommit
            with conn.cursor() as cur:
                cur.execute(query)
                if not autocommit:
                    conn.commit()
                try:
                    return cur.fetchall()
                except ProgrammingError as e:
                    return None

    # For mainly debug, This method is used to show sql to be issued to database. 
    def show_sql(self, query):
        with connect(self.dburl) as conn:
            print(query.as_string(conn))

    def add_task(self, task_id, user_id, task_name, task_pro, task_dead, task_done):
        query = sql.SQL("""
            INSERT INTO \"tasks\" ( {fields} ) VALUES ( {values} )
        """).format(
            tablename = sql.Identifier("tasks"),
            fields = sql.SQL(", ").join([
                sql.Identifier("task_id"),
                sql.Identifier("user_id"),
                sql.Identifier("task_name"),
                sql.Identifier("task_pro"),
                sql.Identifier("task_dead"),
                sql.Identifier("task_done")
            ]),
            values = sql.SQL(", ").join([
                sql.Literal(task_id),
                sql.Literal(user_id),
                sql.Literal(task_name),
                sql.Literal(task_pro),
                sql.Literal(task_dead),
                sql.Literal(task_done)
            ])
        )
        self.execute(query, autocommit=True)

    def add_project(self, pro_id, user_id, name, share):
        query = sql.SQL("""
            INSERT INTO \"projects\" ( {fields} ) VALUES ( {values} )
        """).format(
            tablename = sql.Identifier("projects"),
            fields = sql.SQL(", ").join([
                sql.Identifier("pro_id"),
                sql.Identifier("user_id"),
                sql.Identifier("name"),
                sql.Identifier("share")
            ]),
            values = sql.SQL(", ").join([
                sql.Literal(pro_id),
                sql.Literal(user_id),
                sql.Literal(name),
                sql.Literal(share)
            ])
        )
        self.execute(query, autocommit=True)