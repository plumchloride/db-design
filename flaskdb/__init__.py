"""
A Sample Web-DB Application for DB-DESIGN lecture
Copyright (C) 2022 Yasuhiro Hayashi
"""
from flask import Flask
apps = Flask(__name__)
apps.config.from_object("flaskdb.config")

from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy(apps)

from flaskdb.dataaccess import DataAccess
import flaskdb.var as v
da = DataAccess(v.HOSTNAME, v.PORT, v.DBNAME, v.USERNAME, v.PASSWORD)

CONTEXT_PATH = "/flaskdb"
from flaskdb.views import app
apps.register_blueprint(app, url_prefix=CONTEXT_PATH + "/")