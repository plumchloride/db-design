from flask import Blueprint, render_template ,request
import pandas as pd
import json
from flaskdb import apps, da
from psycopg2 import sql

# ローカルストレージkey関連　＝＞ flaskで鯖建ててるなら、ログイン系のライブラリ使うか、クッキー使うかすべき
import string
import secrets

app = Blueprint("app", __name__)

# アプリページ
@app.route('/index.html')
def getapp():
  return render_template('index.html')

# ログイン
@app.route("/login",methods=["POST"])
def login():
  josn_receive = request.json
  user_id = josn_receive["user_id"]
  # パスワードログイン
  if josn_receive["mode"] == "password":
    if da.execute(sql.SQL(f"SELECT * FROM users WHERE id='{user_id}'")) == []:
      return "ignore id",400
    else:
      if da.execute(sql.SQL(f"SELECT password FROM users WHERE id='{user_id}'"))[0][0] != josn_receive["password"]:
        return "ignore password",400
      else:
        # ローカルストレージkeyがある場合はそのkeyを送る
        return json.dumps({"local_storage_key": da.execute(sql.SQL(f"SELECT key FROM users WHERE id='{user_id}'"))[0][0]})

  # 保存されたローカルストレージkeyログイン
  elif josn_receive["mode"] == "local_storage":
    if da.execute(sql.SQL(f"SELECT * FROM users WHERE id='{user_id}'")) == []:
      return "ignore id",400
    else:
      if da.execute(sql.SQL(f"SELECT key FROM users WHERE id='{user_id}'"))[0][0] != josn_receive["local_storage_key"]:
        return "ignore key",400
      else:
        # ログイン成功
        return "ok"

# タスク追加
@app.route("/add_task",methods=["POST"])
def add_task():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    tasks = da.execute(sql.SQL('SELECT * FROM tasks'))
    max_task_num = len(tasks)+1

    # タスクを記述（openで記述）task_id,user_id,task_name,task_pro,task_dead,task_done,pre_time
    # task_id 全タスク数+1(string)
    # user_id ユーザID
    # task_pro プロジェクトID
    # task_dead タスク締め切りUNIX時間
    # task_done bool タスクが終わっているか否か
    da.add_task(str(max_task_num), josn_receive['user_id'], josn_receive['title'].replace(',','-'), josn_receive['project'], josn_receive['deadline'], False)
    return "ok"
  return "ignore"

# アプリに必要なデータベースのデータ取得
@app.route("/get_data",methods=["POST"])
def get_data():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):

    # 自分のプロジェクト取得
    projects = da.execute(sql.SQL(f"SELECT * FROM projects WHERE user_id='{josn_receive['user_id']}'"))
    pro_items = [list(project) for project in projects]

    # 購読しているプロジェクトid取得
    # 例：元プロジェクトID-元プロジェクトID => 1-5
    if da.execute(sql.SQL(f"SELECT getpro FROM users WHERE id='{josn_receive['user_id']}'"))[0][0] == None:
      get_list = []
    else:
      get_list = da.execute(sql.SQL(f"SELECT getpro FROM users WHERE id='{josn_receive['user_id']}'"))[0][0].split("-")
    if len(get_list)!=0:
      for i,name in enumerate(get_list):
        # 数値やら少数やらに変えられるため、強制的にstrに変更
        get_list[i] = str(int(float(name)))
    
    # シェアされているが購読していないプロジェクトデータ取得
    # 自分のuser_idじゃないプロジェクトの内、購読していない(!= i)プロジェクト
    share_notget = da.execute(sql.SQL(f"SELECT * FROM projects WHERE user_id!='{josn_receive['user_id']}' AND share='True'"))
    share_notget = [list(project) for project in share_notget]
    if len(get_list) != 0:
      join_str = "','".join(map(str,get_list))
      share_notget = da.execute(sql.SQL(f"SELECT * FROM projects WHERE user_id!='{josn_receive['user_id']}' AND share='True' AND pro_id NOT IN (\'{join_str}\')"))
      share_items = [list(project) for project in share_notget]
    else:
      share_items = share_notget

    # シェアされていて、自分が取得しているプロジェクトデータ取得
    # for文でiを回した物
    share_get_items = []
    if len(get_list) != 0:
      join_str = "','".join(map(str,get_list))
      share_get = da.execute(sql.SQL(f"SELECT * FROM projects WHERE pro_id IN (\'{join_str}\')"))
      share_get_items = [list(project) for project in share_get]

    # シェアされていて、自分のタスクに追加していないタスクを追加
    mytask_id_list = [list(project)[0] for project in list(da.execute(sql.SQL(f"SELECT task_id FROM tasks WHERE user_id='{josn_receive['user_id']}'")))]
    for i in get_list:
      # プロジェクトごと（i:元プロジェクトID）
      # 元プロジェクトのタスクを取得（それを自分に追加するか追加しないか判別する）
      # 自分に追加する際にtask_idを「share-{元プロジェクトID}-{元タスクID}」と変更して入れるため、該当のタスクじゃない物を取得する　＝＞　not(想定タスクID in 自分のすべてのタスクID)
      for z in da.execute(sql.SQL(f"SELECT * FROM tasks WHERE task_pro='{i}'")):
        if not(str(f"share-{i}-{z[0]}") in mytask_id_list):
        # add_task_filter は [True,False] のようになっているため、それをdf[add_task_filter][列名]で列を取得し、zipに入れ込んでいる
        # タスクを記述（openで記述）するための体裁に合わせている
        # task_id,user_id,task_name,task_pro,task_dead,task_done
          da.add_task(f"share-{i}-{z[0]}", josn_receive['user_id'], z[2], f"share-{i}-{josn_receive['user_id']}", z[4], False)

    # 自分の全タスク取得
    task_items = [list(task) for task in da.execute(sql.SQL(f"SELECT * FROM tasks WHERE user_id='{josn_receive['user_id']}'"))]
    # プロジェクトIDと期限でソート
    task_sorted_items = sorted(task_items,key = lambda x: (x[3], x[4]))


    # tasks [[task_id,user_id,task_name,task_pro,task_dead,task_done,pre_time], ...](task_proとtask_deadでソートされている)
    # project [[pro_id,user_id,name,share], ...](ソート無し)
    # shared_project [[pro_id,user_id,name,share], ...](ソート無し) シェアされていて、自分が取得していないプロジェクト
    # shared_project_getted [[pro_id,user_id,name,share], ...](ソート無し) シェアされていて、自分が取得しているプロジェクト
    return json.dumps({"tasks":task_sorted_items,"project":pro_items,"shared_project":share_items,"shared_project_getted":share_get_items})
  else:
    return "ignore",400

# プロジェクト追加
@app.route("/add_pro",methods=["POST"])
def add_pro():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    projects = da.execute(sql.SQL('SELECT * FROM projects'))
    pro_id = len(projects)+1
    da.add_project(pro_id, josn_receive["user_id"], josn_receive["name"],False)

    # [pro_id,user_id,name,share]
    # pro_id プロジェクトに登録されている数+1
    # user_id ユーザID
    # name プロジェクト名
    # share 共有するか　初期値False

    # pro [[pro_id,user_id,name,share]](ソート無し)(get_dataと形式を合わせている)
    return json.dumps({"pro":[pro_id,josn_receive["user_id"],josn_receive["name"],False]})
  else:
    return "ignore",400

# タスクのdone notdone の切り替え
@app.route("/change_task",methods=["POST"])
def change_task():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    task_id = str(josn_receive["taks_id"])

    # tfに誤りが無いか
    if da.execute(sql.SQL(f"SELECT task_done FROM tasks WHERE task_id='{task_id}'"))[0][0] == josn_receive["tf"]:
      return "ignore tf",400
    else:
      # 誤りが無ければ、それに変更
      da.execute(sql.SQL(f"UPDATE tasks SET task_done={josn_receive['tf']} WHERE task_id='{task_id}'"))
      return "ok"
  else:
    return "ignore pass",400

# 受信したpro_idをshare状態にする
@app.route("/share_pro",methods=["POST"])
def share_pro():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    pro_key = str(josn_receive["pro_key"])
    da.execute(sql.SQL(f"UPDATE projects SET share=True WHERE pro_id='{pro_key}'"))
    return "ok"
  else:
    return "ignore pass",400

# 受信したpro_idを購読リストに追加する
@app.route("/get_pro",methods=["POST"])
def get_pro():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    # 購読リストに追加
    df = pd.read_csv("./flaskdb/static/user.csv",index_col=0)
    if da.execute(sql.SQL(f"SELECT getpro FROM users WHERE id='{josn_receive['user_id']}'"))[0][0] == None:
      get_list = []
    else:
      get_list = da.execute(sql.SQL(f"SELECT getpro FROM users WHERE id='{josn_receive['user_id']}'"))[0][0].split("-")
    get_list.append(str(josn_receive["pro_key"]))
    get_str = "-".join(get_list)
    da.execute(sql.SQL(f"UPDATE users SET getpro='{get_str}' WHERE id='{josn_receive['user_id']}'"))

    # プロジェクトを作製
    # [pro_id,user_id,name,share]
    # share_project ["share-{元プロジェクトID}-{利用者ID}","利用者ID","share-{作製者}-{元プロジェクト名前}","共有しているかどうか"]
    pro_id = f"share-{str(josn_receive['pro_key'])}-{str(josn_receive['user_id'])}"
    da.add_project(pro_id, josn_receive["user_id"], f"share-{josn_receive['name']}", False)
    return "ok"
  else:
    return "ignore pass",400


# パスワード生成
def pass_gen(size=12):
  chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
  chars += '%&$#_-'
  return ''.join(secrets.choice(chars) for x in range(size))

# ログイン確認-新たに送られたデータがログイン済みのユーザの物か確認
def check_user(user_id,key):
  if da.execute(sql.SQL(f"SELECT * FROM users WHERE id='{user_id}'")) == []:
    return False
  else:
    if da.execute(sql.SQL(f"SELECT key FROM users WHERE id='{user_id}'"))[0][0] != key:
      return False
    else:
      return True

if __name__ == "__main__":
    app.run(debug=True)