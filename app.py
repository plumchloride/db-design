"""
A Sample Web-DB Application for DB-DESIGN lecture
Copyright (C) 2022 Yasuhiro Hayashi
"""
from flaskdb import apps

if __name__ == "__main__":
    apps.run(debug=True, host="127.0.0.1", port=5001)
