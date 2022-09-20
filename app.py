from flask import Flask, render_template ,request
import pandas as pd
import json

# ローカルストレージkey関連　＝＞ flaskで鯖建ててるなら、ログイン系のライブラリ使うか、クッキー使うかすべき
import string
import secrets

app = Flask(__name__)

@app.route('/index.html')
def getapp():
  return render_template('index.html')

@app.route("/login",methods=["POST"])
def login():
  # df = pd.read_csv("user.csv")
  josn_receive = request.json
  if josn_receive["mode"] == "password":
    if josn_receive["user_id"] == "admin" and josn_receive["password"] == "password":
      return json.dumps({"local_storage_key": "test_key"})
  elif josn_receive["mode"] == "local_storage":
    if josn_receive["user_id"] == "admin" and josn_receive["local_storage_key"] == "test_key":
      return "ok"
  return "ignore id",400
  return "ignore password",400
  return "over limit",400

@app.route("/add_task",methods=["POST"])
def add_task():
  josn_receive = request.json
  if josn_receive["user_id"] == "admin" and josn_receive["local_storage_key"] == "test_key":
    with open('./static/task.csv', 'a') as f:
      print(f"{josn_receive['user_id']},some_num,{josn_receive['title']},{josn_receive['project']},{josn_receive['deadline']},false,{1800}", file=f)
      # print(f"{josn_receive['user_id']},some_num,{josn_receive['title']},{josn_receive['project']},{josn_receive['deadline']},false,{josn_receive['pre_time']}", file=f)
  # df = "test"
  # return_dic = {"test":df["left-upper"].values.tolist()}
    return "ok"
  return "ignore pass"

@app.route("/get_data",methods=["POST"])
def get_data():
  josn_receive = request.json
  if josn_receive["user_id"] == "admin" and josn_receive["local_storage_key"] == "test_key":
    df = pd.read_csv("./static/task.csv",encoding="shift-jis")
    df = df[df["user_id"] == "admin"]
    items = df.values.tolist()
    # プロジェクトIDと期限でソート
    sorted_items = sorted(
      items,
      key = lambda x: (x[3], x[4])
    )
  return json.dumps({"tasks":sorted_items})


def pass_gen(size=12):
  chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
  chars += '%&$#_-'

  return ''.join(secrets.choice(chars) for x in range(size))


if __name__ == "__main__":
    app.run(debug=True)