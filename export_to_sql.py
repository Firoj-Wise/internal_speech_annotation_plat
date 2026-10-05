import sqlite3
import os

db_path = 'data/annotations.db'
sql_out_path = 'annotations_dump.sql'

if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
with open(sql_out_path, 'w', encoding='utf-8') as f:
    for line in conn.iterdump():
        f.write(f'{line}\n')

print(f"Successfully exported database to {sql_out_path} ({os.path.getsize(sql_out_path)} bytes)")
