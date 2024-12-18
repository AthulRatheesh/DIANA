import psycopg2 as pg
from psycopg2 import pool
import os
from typing import Optional
from contextlib import contextmanager
from utils.config import config
import psycopg2

class DataBaseManager:

    def __init__(self):
        try:
            self.db_config=config()
            #print(self.db_config)

            #Creating a connection pool
            self.connection_pool = pool.SimpleConnectionPool(
                minconn=1,
                maxconn=20,
                **self.db_config
            )

        except psycopg2.Error as e:
            raise Exception(f"Error creating connection pool: {e}")
    
    @contextmanager
    def get_connection(self):   #return connection object
        conn = None
        try:
            conn = self.connection_pool.getconn()
            yield conn
        except psycopg2.Error as e:
            raise Exception(f"Error getting connection from pool: {e}")
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def execute_query(self, query: str, parameters: Optional[tuple] = None):    #either tuple or None
        """Execute a query and return results"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute(query, parameters)
                    conn.commit()
                    if cur.description:  # If the query returns data
                        return cur.fetchall()
                    return None
                except psycopg2.Error as e:
                    conn.rollback()
                    raise Exception(f"Query execution failed: {e}")

    def execute_many(self, query: str, parameters: list):
        """Execute multiple queries"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.executemany(query, parameters)
                    conn.commit()
                except psycopg2.Error as e:
                    conn.rollback()
                    raise Exception(f"Batch query execution failed: {e}")

    def __del__(self):
        """Clean up connection pool"""
        if self.connection_pool:
            self.connection_pool.closeall()

db = DataBaseManager()

try:
    create_query="""
                    CREATE TABLE IF NOT EXISTS wee(slno int);"""
    db.execute_query(create_query)
    

except Exception as e:
    print(f"Error: {e}")