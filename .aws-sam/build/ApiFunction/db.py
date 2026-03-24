"""
db.py — Backend dispatcher.
Selects DynamoDB (AWS Lambda) or SQLite (local/Render) based on DB_BACKEND env var.
"""
import os
if os.environ.get("DB_BACKEND") == "dynamo":
    from db_dynamo import *   # noqa: F401, F403
else:
    from db_sqlite import *   # noqa: F401, F403
