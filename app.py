from flask import Flask, render_template ,request
import pandas as pd
import json

# ローカルストレージkey関連　＝＞ flaskで鯖建ててるなら、ログイン系のライブラリ使うか、クッキー使うかすべき
import string
import secrets

app = Flask(__name__)

# アプリページ
@app.route('/index.html')
def getapp():
  return render_template('index.html')

# ログイン
@app.route("/login",methods=["POST"])
def login():
  df = pd.read_csv("./static/user.csv",index_col=0)
  josn_receive = request.json
  user_id = josn_receive["user_id"]
  # パスワードログイン
  if josn_receive["mode"] == "password":
    if not(user_id in df.index):
      return "ignore id",400
    else:
      if df.at[user_id,"password"] != josn_receive["password"]:
        return "ignore password",400
      elif str(df.at[user_id,"key"]) == "nan":
        # ローカルストレージkeyが無い場合は生成して、保存してそのkeyを送る
        key = pass_gen()
        df.at[user_id,"key"] = key
        df.to_csv("./static/user.csv")
        return json.dumps({"local_storage_key": key})
      else:
        # ローカルストレージkeyがある場合はそのkeyを送る
        return json.dumps({"local_storage_key": df.at[user_id,"key"]})

  # 保存されたローカルストレージkeyログイン
  elif josn_receive["mode"] == "local_storage":
    if not(user_id in df.index):
      return "ignore id",400
    else:
      if str(df.at[user_id,"key"]) == "nan":
        return "no key",400
      elif df.at[user_id,"key"] != josn_receive["local_storage_key"]:
        return "ignore key",400
      else:
        # ログイン成功
        return "ok"

# タスク追加
@app.route("/add_task",methods=["POST"])
def add_task():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    task_df = pd.read_csv("./static/task.csv")
    max_task_num = len(task_df)+1
    task_df = task_df[task_df["user_id"] == josn_receive["user_id"]]

    # タスクを記述（openで記述）task_id,user_id,task_name,task_pro,task_dead,task_done,pre_time
    # task_id 全タスク数+1(string)
    # user_id ユーザID
    # task_pro プロジェクトID
    # task_dead タスク締め切りUNIX時間
    # task_done bool タスクが終わっているか否か
    # pre_time 数値（1800固定）タスクにかかる時間（予想）　制作の時間が無いため、今回は定数入力
    with open('./static/task.csv', 'a', encoding='utf-8') as f:
      print(f"{str(max_task_num)},{josn_receive['user_id']},{josn_receive['title'].replace(',','-')},{josn_receive['project']},{josn_receive['deadline']},false,{1800}", file=f)
    return "ok"
  return "ignore"

# アプリに必要なデータベースのデータ取得
@app.route("/get_data",methods=["POST"])
def get_data():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):

    # 自分のプロジェクト取得
    pro_df_ = pd.read_csv("./static/project.csv")
    pro_df = pro_df_[pro_df_["user_id"] == josn_receive["user_id"]]
    pro_items = pro_df.values.tolist()

    # 購読しているプロジェクトid取得
    # user.csv get-proにて「- (ハイフン)」区切りのデータで保存してある
    # 例：元プロジェクトID-元プロジェクトID => 1-5
    user_df = pd.read_csv("./static/user.csv",index_col=0)
    if str(user_df.at[josn_receive["user_id"],"get-pro"]) == "nan":
      get_list = []
    else:
      get_list =str(user_df.at[josn_receive["user_id"],"get-pro"]).split("-")
    if len(get_list)!=0:
      for i,name in enumerate(get_list):
        # 数値やら少数やらに変えられるため、強制的にstrに変更
        get_list[i] = str(int(float(name)))

    # シェアされているが購読していないプロジェクトデータ取得
    # 自分のuser_idじゃないプロジェクトの内、購読していない(!= i)プロジェクト
    share_df = pro_df_[pro_df_["user_id"] != josn_receive["user_id"]]
    share_notget_df = share_df[share_df["share"]]
    if len(get_list) != 0:
      for i in get_list:
        share_notget_df = share_notget_df[share_notget_df["pro_id"] != i]
    share_items = share_notget_df.values.tolist()

    # シェアされていて、自分が取得しているプロジェクトデータ取得
    # for文でiを回した物
    share_get_items = []
    for i in get_list:
      share_get_items.append(share_df[share_df["pro_id"] == i].values.tolist()[0])

    # シェアされていて、自分のタスクに追加していないタスクをcsvに追加
    task_df = pd.read_csv("./static/task.csv")
    add_task = []
    for i in get_list:
      # プロジェクトごと（i:元プロジェクトID）
      # 元プロジェクトのタスクを取得（それを自分に追加するか追加しないか判別する）
      add_task_filter = []
      get_task_df = task_df[task_df["task_pro"] == i]
      # 自分に追加する際にtask_idを「share-{元プロジェクトID}-{元タスクID}」と変更して入れるため、該当のタスクじゃない物を取得する　＝＞　not(想定タスクID in 自分のすべてのタスクID)
      for z in get_task_df["task_id"]:
        add_task_filter.append(not(f"share-{i}-{z}" in task_df[task_df["user_id"] == josn_receive["user_id"]]["task_id"].values.tolist()))
      # add_task_filter は [True,False] のようになっているため、それをdf[add_task_filter][列名]で列を取得し、zipに入れ込んでいる
      # タスクを記述（openで記述）するための体裁に合わせている
      # task_id,user_id,task_name,task_pro,task_dead,task_done,pre_time
      if len(add_task_filter) != 0:
        for z_id,z_name,z_dead in zip(get_task_df[add_task_filter]["task_id"],get_task_df[add_task_filter]["task_name"],get_task_df[add_task_filter]["task_dead"]):
          add_task.append([f"share-{i}-{z_id}",josn_receive['user_id'],z_name,f"share-{i}-{josn_receive['user_id']},{z_dead},false,{1800}"])

    # シェアで追加していなかったタスクを追加
    if len(add_task) != 0:
      with open('./static/task.csv', 'a', encoding='utf-8') as f:
        for i in add_task:
          print(",".join(i), file=f)

    # 自分の全タスク取得
    task_df = pd.read_csv("./static/task.csv")
    task_df = task_df[task_df["user_id"] == josn_receive["user_id"]]
    task_items = task_df.values.tolist()
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
    df = pd.read_csv("./static/project.csv",index_col=0)
    pro_id = len(df)+1
    df.loc[pro_id] = [josn_receive["user_id"],josn_receive["name"],False]

    # [pro_id,user_id,name,share]
    # pro_id プロジェクトに登録されている数+1
    # user_id ユーザID
    # name プロジェクト名
    # share 共有するか　初期値False
    df.to_csv("./static/project.csv")

    # pro [[pro_id,user_id,name,share]](ソート無し)(get_dataと形式を合わせている)
    return json.dumps({"pro":[pro_id,josn_receive["user_id"],josn_receive["name"],False]})
  else:
    return "ignore",400

# タスクのdone notdone の切り替え
@app.route("/change_task",methods=["POST"])
def change_task():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    task_df = pd.read_csv("./static/task.csv",index_col=0)
    # intかstrか
    if str(josn_receive["taks_id"]) in task_df.index:
      task_id = str(josn_receive["taks_id"])
      pass
    elif int(josn_receive["taks_id"]) in task_df.index:
      task_id = int(josn_receive["taks_id"])
      pass
    else:
      return "igrone taks_id",400

    # tfに誤りが無いか
    if task_df.at[task_id,"task_done"] == josn_receive["tf"]:
      return "ignore tf",400
    else:
      # 誤りが無ければ、それに変更
      task_df.at[task_id,"task_done"] = josn_receive["tf"]
      task_df.to_csv("./static/task.csv")
      return "ok"
  else:
    return "ignore pass",400

# 受信したpro_idをshare状態にする
@app.route("/share_pro",methods=["POST"])
def share_pro():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    pro_df = pd.read_csv("./static/project.csv",index_col=0)
    # intかstrか
    if str(josn_receive["pro_key"]) in pro_df.index:
      pro_key = str(josn_receive["pro_key"])
      pass
    elif int(josn_receive["pro_key"]) in pro_df.index:
      pro_key = int(josn_receive["pro_key"])
      pass
    else:
      return "igrone taks_id",400

    pro_df.at[pro_key,"share"] = True
    pro_df.to_csv("./static/project.csv")
    return "ok"
  else:
    return "ignore pass",400

# 受信したpro_idを購読リストに追加する
@app.route("/get_pro",methods=["POST"])
def get_pro():
  josn_receive = request.json
  if check_user(josn_receive["user_id"],josn_receive["local_storage_key"]):
    # 購読リストに追加
    df = pd.read_csv("./static/user.csv",index_col=0)
    if str(df.at[josn_receive["user_id"],"get-pro"]) == "nan":
      get_list = []
    else:
      get_list =str(df.at[josn_receive["user_id"],"get-pro"]).split("-")
    get_list.append(josn_receive["pro_key"])
    get_str = "-".join(get_list)
    df.at[josn_receive["user_id"],"get-pro"] = get_str
    df.to_csv("./static/user.csv")

    # プロジェクトを作製
    # [pro_id,user_id,name,share]
    # share_project ["share-{元プロジェクトID}-{利用者ID}","利用者ID","share-{作製者}-{元プロジェクト名前}","共有しているかどうか"]
    df = pd.read_csv("./static/project.csv",index_col=0)
    pro_id = f"share-{str(josn_receive['pro_key'])}-{str(josn_receive['user_id'])}"
    df.loc[pro_id] = [josn_receive["user_id"],f"share-{josn_receive['name']}",False]
    df.to_csv("./static/project.csv")

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
  user_df = pd.read_csv("./static/user.csv",index_col=0)
  if not(user_id in user_df.index):
    return False
  else:
    if str(user_df.at[user_id,"key"]) == "nan":
      return False
    elif user_df.at[user_id,"key"] != key:
      return False
    else:
      return True


if __name__ == "__main__":
    app.run(debug=True)