// 先頭$ => DOM    全部大文字 => 定数
let now_process = false
let time_interval;
// チャート初期化用
let myChart = "A";

//  ナビゲーション切り替え機能
// const NAV_NAME_LIST = ['top','work','share','pro','anl','info']
const NAV_NAME_LIST = ['top','work','share','pro','info']
const $NAV_DIC = {'top':document.getElementById("top_nav"),'work':document.getElementById("work_nav"),'share':document.getElementById("share_nav"),'pro':document.getElementById("pro_nav"),'anl':document.getElementById("anl_nav"),'info':document.getElementById("info_nav")}
const $MAIN_DIC = {'top':document.getElementById("top"),'work':document.getElementById("work"),'share':document.getElementById("share"),'pro':document.getElementById("pro"),'anl':document.getElementById("anl"),'info':document.getElementById("info")}
const change_page = (to_page) =>{
  NAV_NAME_LIST.forEach((nav_name)=>{
    if(nav_name == to_page){
      $NAV_DIC[nav_name].classList.add("nav-active")
      $MAIN_DIC[nav_name].classList.remove("non-visi")
    }else{
      $NAV_DIC[nav_name].classList.remove("nav-active")
      $MAIN_DIC[nav_name].classList.add("non-visi")
    }

  })
}
// ログインログアウトnav
const login_logout = (mode)=>{
  if(mode == "login"){
    document.getElementById("login").classList.remove("non-visi")
  }else if(mode == "logout"){
    var result = window.confirm("ログアウトしますか？")
    if(result){
      user_data = {"id":"","key":""}
      localStorage.removeItem('DS-user');
      localStorage.removeItem('DS-key');
      document.getElementById("login").classList.remove("non-visi")
      document.getElementById("log_nav").innerText = "ログイン"
      document.getElementById("log_nav").setAttribute("onclick","login_logout('login');")
      // 仮のログアウト処理
      location.reload()
    }
  }
}
// 実際のログイン
let login_fin = false;
const login  = (mode)=>{
  if(mode == "form"){
    user_data["id"] = document.getElementById("user_id").value
    var save = document.getElementById("save_local").checked
    var send_json = JSON.stringify({"user_id":user_data["id"],"password":document.getElementById("password").value,"mode":"password"})
  }else if(mode == "local_storage"){
    var send_json = JSON.stringify({"user_id":user_data["id"],"local_storage_key":user_data["key"],"mode":"local_storage"})
    var save = false
  }
    document.getElementById("password").value = ""
    xhr = new XMLHttpRequest;
    xhr.onload = function(){
      if(xhr.status == 200){
        document.getElementById("login").classList.add("non-visi")
        document.getElementById("login_error").classList.add("non-visi")
        document.getElementById("log_nav").innerText = "ログアウト"
        document.getElementById("log_nav").setAttribute("onclick","login_logout('logout');")
        document.getElementById("top_nav").innerText = user_data["id"]
        if(xhr.responseText == "ok"){
          ;
        }else{
          var res = JSON.parse(xhr.responseText);
          user_data["key"] = res["local_storage_key"];
          if(save){
            localStorage.setItem("DS-user",JSON.stringify(user_data["id"]))
            localStorage.setItem("DS-key",JSON.stringify(user_data["key"]))
          }else{
            localStorage.removeItem('DS-user');
            localStorage.removeItem('DS-key');
          }
        }
        login_fin = true;
        // ログイン後のデータ取得
        get_data();
      }else if(xhr.status == 400){
        var res = xhr.responseText;
        if(res == "ignore id" | res == "ignore password"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ユーザ名またはパスワードが違います";
        }else if(res == "over limit"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が期限切れです。再度ログインして下さい";
        }else{
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
        }
      }else{
        error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
      }
    };
    xhr.onerror = function(){
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
    xhr.open('POST', "./login", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(send_json);
}


// ローカルストレージ確認
function isLocalStorageAvlbl(){
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('dummy', '1');
      if (localStorage.getItem('dummy') === '1') {
        localStorage.removeItem('dummy');
        return true;
      } else {
        return false;
      }
    } catch(e) {
      return false;
    }
  } else {
    return false;
  }
}
//　ローカルストレージ確認
let login_type = undefined;
let user_data = {"id":"","key":""}
if(isLocalStorageAvlbl){
  if(localStorage.getItem("DS-key") == null | localStorage.getItem("DS-user") == null){
    // 通常ログイン
    login_type = "normal"
  }else{
    // ローカルストレージログイン
    user_data["id"] = JSON.parse(localStorage.getItem("DS-user"))
    user_data["key"] = JSON.parse(localStorage.getItem("DS-key"))
    login("local_storage");
  }
}else{
  // 通常ログイン(ローカルストレージ無し)
  document.getElementById("no_local").classList.remove("non-visi")
  document.getElementById("save_local").setAttribute("disabled","")
};

// タスク登録
const push_ss_btn = ()=>{
  var _title = document.getElementById("task_title");
  var _pro_select = document.getElementById("work_pro_select");
  var _deadline = document.getElementById("deadline");
  var fill_list = [_title.value == "",_pro_select.value=="None",_deadline.value=="None"]
  if(fill_list.reduce((sum, element) => sum + element, 0)!=0){
    error("ERROR:値をすべて入力してください",`<ul>${"<li>作業内容を入力して下さい</li>".repeat(Number(fill_list[0]))}${"<li>プロジェクトを選択して下さい</li>".repeat(Number(fill_list[1]))}${"<li>期限を選択して下さい</li>".repeat(Number(fill_list[2]))}</ul>`)
    console.log("値をすべて入力して下さい")
  }else{
    // データ送信
    // console.log(_title.value)
    // console.log({"user_id": user_data["id"],"title": _title.value,"project": _pro_select.value,"deadline":_deadline.value,"local_storage_key": user_data["key"]})
    var send_json = JSON.stringify({"user_id": user_data["id"],"title": _title.value,"project": _pro_select.value,"deadline":Math.floor(Date.parse(_deadline.value)/1000),"local_storage_key": user_data["key"]})
    document.getElementById("task_title").value = "";
    document.getElementById("work_pro_select").value = "";
    document.getElementById("deadline").value = now_date;
    var xhr = new XMLHttpRequest;
    xhr.onload = function(){
      if(xhr.status == 200){
        var res = xhr.responseText;
        console.log(res)
        get_data(true);
      }else if(xhr.status == 400){
        var res = xhr.responseText;
        if(res == "over limit"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が期限切れです。再度ログインして下さい";
        }else{
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
        }
      }else{
        error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
      }
    };
    xhr.onerror = function(){
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
    xhr.open('POST', "./add_task", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(send_json);
  }
}

// プロジェクト追加select読み込み
document.getElementById("work_pro_select").addEventListener("change",(e)=>{
  if(e.target.value == "ireg"){
    e.target.value = "None"
    add_pro();
  }
})
var pro_name = null
const add_pro = ()=>{
  pro_name = prompt('プロジェクト名を入力して下さい\n例：データサイエンス演習',"");
  if(pro_name != null){
    var send_json = JSON.stringify({"user_id":user_data["id"],"local_storage_key":user_data["key"],"name":pro_name})
    xhr = new XMLHttpRequest;
    xhr.onload = function(){
      if(xhr.status == 200){
        var res = JSON.parse(xhr.responseText);
        create_project_select({"project":[res["pro"]]},false);
      }else if(xhr.status == 400){
        var res = JSON.parse(xhr.responseText)
        if(res == "over limit"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が期限切れです。再度ログインして下さい";
        }else{
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
        }
      }else{
        error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
      }
    };
    xhr.onerror = function(){
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
    xhr.open('POST', "./add_pro", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(send_json);
  }
}

// エラー表示
const error = (title,text)=>{
  document.getElementById("error_title").innerText = title;
  document.getElementById("error_text").innerHTML = text;
  document.getElementById("error").classList.remove("non-visi");
}
document.getElementById("error").addEventListener("click",e=>{
  if(e.target.id=="error"){
      e.target.classList.add("non-visi")
  }
});
let now_date = "";
(()=>{
  var now =new Date();
  now_date = `${now.getFullYear()}-${("0"+String(now.getMonth()+1)).slice(-2)}-${("0"+String(now.getDay())).slice(-2)}T${("0"+String(now.getHours())).slice(-2)}:${("0"+String(now.getMinutes())).slice(-2)}`
  document.getElementById("deadline").value = `${now.getFullYear()}-${("0"+String(now.getMonth()+1)).slice(-2)}-${("0"+String(now.getDate())).slice(-2)}T${("0"+String(now.getHours())).slice(-2)}:${("0"+String(now.getMinutes())).slice(-2)}`
})()

// task等のデータ取得（とりあえず全データ）
const get_data = (only_task = false)=>{
  var send_json = JSON.stringify({"user_id": user_data["id"],"local_storage_key": user_data["key"]})
  xhr = new XMLHttpRequest;
  xhr.onload = function(){
    if(xhr.status == 200){
      if(only_task){
        create_row(JSON.parse(xhr.responseText))
      }else{
        create_project_select(JSON.parse(xhr.responseText),true)
      }
    }else if(xhr.status == 400){
      var res = xhr.responseText;
      if(res == "ignore id" | res == "ignore password"){
        document.getElementById("login_error").classList.remove("non-visi");
        document.getElementById("login_error").innerText = "ユーザ名またはパスワードが違います";
      }else if(res == "over limit"){
        document.getElementById("login_error").classList.remove("non-visi");
        document.getElementById("login_error").innerText = "ログイン情報が期限切れです。再度ログインして下さい";
      }else{
        document.getElementById("login_error").classList.remove("non-visi");
        document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
      }
    }else{
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
  };
  xhr.onerror = function(){
    error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
  }
  xhr.open('POST', "./get_data", true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(send_json);
}
const weekDay = ["日", "月", "火", "水", "木", "金", "土"];
const create_row = (dic)=>{
  var $row_hand = document.getElementById("task_row");
  $row_hand.innerHTML = ""
  before_pro = 20010801
  dic["tasks"].forEach((e)=>{
    if(e[4]*1000 > (new Date())-604800000 | !e[5]){
      if(before_pro != e[3]){
        var $div = document.createElement("div")
        $div.setAttribute("class","proname")
        $div.innerText = `${project_dic[e[3]]} : ID[${e[3]}]`
        $row_hand.appendChild($div)
        before_pro = e[3]
      }
      var $div = document.createElement("div")
      $div.setAttribute("class","task-row")
      var date = new Date(e[4]*1000)
      var date_text = `${date.getMonth()+1}/${("0"+String(date.getDate())).slice(-2)}（${weekDay[date.getDay()]}）${("0"+String(date.getHours())).slice(-2)}:${("0"+String(date.getMinutes())).slice(-2)}`
      var time_text = `${("0"+Math.floor(e[6]/3600)).slice(-2)}:${("0"+Math.floor((e[6]/60)%60)).slice(-2)}:${("0"+e[6]%60).slice(-2)}`
      var col = "black"
      if(e[4]*1000 < new Date()){
        col = "red"
      }
      $div.innerHTML = `<div class="task_done"><input type="checkbox" name="${e[0]}" id="task-${e[0]}" onchange=(change_task_state('${e[0]}')) ${(e[5]||"")&&"checked"}></div><label for="task-${e[0]}"><div class="task_name">${e[2]}</div></label>
      <div class="task_dead" style="color:${col};">${date_text}</div>
      <div class="task_del">…</div>`
      $row_hand.appendChild($div)
    }
  })
}


// プロジェクト一覧作成
let project_dic = {0:"プロジェクト無し"};
const create_project_select = (response,from_get_data)=>{
  var $work_pro_select = document.getElementById("work_pro_select")
  var $share_pro = document.getElementById("share_pro")
  var $share_done = document.getElementById("share_done")
  var $share_get = document.getElementById("share_get")
  // var $pro_list = document.getElementById("project_output")
  console.log(response)
  response["project"].forEach(elm=>{
    if(!(elm[0] in Object.keys(project_dic))){
      project_dic[elm[0]] = elm[2]
      $_option = document.createElement("option")
      $_option.setAttribute("value",elm[0]);
      $_option.innerText = `${elm[2]}`
      $work_pro_select.appendChild($_option)
      // $pro_list.innerHTML += `<li>${elm[2]}</li>`

      // シェア画面
      // console.log(elm)
      if(elm[2].slice(0,6) == 'share-'){
        $li = document.createElement("li")
        $li.innerText = `${elm[2]} : ID[${elm[0]}]`
        $share_get.appendChild($li)
      }else if(elm[3]){
        $li = document.createElement("li")
        $li.innerText = `${elm[2]} : ID[${elm[0]}]`
        $share_done.appendChild($li)
      }else{
        $li = document.createElement("li")
        $li.innerText = `${elm[2]} : ID[${elm[0]}]`
        $li.setAttribute("onclick",`share_pro(${elm[0]})`)
        $li.setAttribute("class","share-li")
        $li.setAttribute("id",`share-li-${elm[0]}`)
        $share_pro.appendChild($li)
      }
    }
  })
  if(from_get_data){
    create_row(JSON.parse(xhr.responseText))
    create_get_window(JSON.parse(xhr.responseText)["shared_project"])
    create_getted_window(JSON.parse(xhr.responseText)["shared_project_getted"])
  }
}

// タスクの状況変更
const change_task_state = (id)=>{
  var dom = document.getElementById(`task-${id}`)
  var send_json = JSON.stringify({"user_id": user_data["id"],"local_storage_key": user_data["key"],"taks_id":id,"tf":dom.checked})
  xhr = new XMLHttpRequest;
  xhr.onload = function(){
    if(xhr.status == 200){
      ;
    }else if(xhr.status == 400){
      var res = xhr.responseText;
      if(res == "ignore id" | res == "ignore password"){
        document.getElementById("login_error").classList.remove("non-visi");
        document.getElementById("login_error").innerText = "ユーザ名またはパスワードが違います";
      }else if(res == "ignore tf" | res == "igrone taks_id"){
        document.getElementById("login_error").classList.remove("non-visi");
        error("ERROR:データベースエラー","タスクの状態が誤っています。リロードして下さい");
      }else{
        document.getElementById("login_error").classList.remove("non-visi");
        document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
      }
    }else{
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
  };
  xhr.onerror = function(){
    error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
  }
  xhr.open('POST', "./change_task", true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(send_json);
}


// プロジェクトのシェア
const share_pro = (id)=>{
  if (confirm(`${project_dic[id]} : ID[${id}]\nを共有しますか？`)){
    var send_json = JSON.stringify({"user_id": user_data["id"],"local_storage_key": user_data["key"],"pro_key":id})
    xhr = new XMLHttpRequest;
    xhr.onload = function(){
      if(xhr.status == 200){
        var $share_done = document.getElementById("share_done")
        document.getElementById(`share-li-${id}`).remove()
        $li = document.createElement("li")
        $li.innerText = `${project_dic[id]} : ID[${id}]`
        $share_done.appendChild($li);
      }else if(xhr.status == 400){
        var res = xhr.responseText;
        if(res == "ignore id" | res == "ignore password"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ユーザ名またはパスワードが違います";
        }else if(res == "ignore tf" | res == "igrone taks_id"){
          document.getElementById("login_error").classList.remove("non-visi");
          error("ERROR:データベースエラー","タスクの状態が誤っています。リロードして下さい");
        }else{
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
        }
      }else{
        error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
      }
    };
    xhr.onerror = function(){
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
    xhr.open('POST', "./share_pro", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(send_json);
  }
}

// タスクゲット画面の生成
const create_get_window = (pros) =>{
  var $pro = document.getElementById("get_pro")
  pros.forEach(e=>{
    var $li = document.createElement("li")
    $li.innerText = `${e[2]} : ID[${e[0]}] : 制作者[${e[1]}]]`
    $li.setAttribute("onclick",`get_pro('${e[0]}','${e[1]}','${e[2]}')`)
    $li.setAttribute("class","share-li")
    $li.setAttribute("id",`shared-pro-${e[0]}`)
    $pro.appendChild($li)
  })
}
// タスクゲット済み画面の生成
const create_getted_window = (pros) =>{
  var $done = document.getElementById("get_done")
  pros.forEach(e=>{
    var $li = document.createElement("li")
    $li.innerText = `${e[2]} : ID[${e[0]}] : 制作者[${e[1]}]`
    $done.appendChild($li)
  })
}
// タスクゲット送信
const get_pro = (id,creater,pro_name) =>{
  if (confirm(`${pro_name} : ID[${id}] : 制作者[${creater}]取得しますか？`)){
    var send_json = JSON.stringify({"user_id": user_data["id"],"local_storage_key": user_data["key"],"pro_key":id,"name":`${creater}-${pro_name}`})
    xhr = new XMLHttpRequest;
    xhr.onload = function(){
      if(xhr.status == 200){
        var $done = document.getElementById("get_done")
        document.getElementById(`shared-pro-${id}`).remove()
        $li = document.createElement("li")
        $li.innerText = `${pro_name} : ID[${id}] : 制作者[${creater}]]`
        project_dic[`share-${id}-${user_data["id"]}`] = `share-${creater}-${pro_name}`
        $done.appendChild($li);
        get_data(true);
      }else if(xhr.status == 400){
        var res = xhr.responseText;
        if(res == "ignore id" | res == "ignore password"){
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ユーザ名またはパスワードが違います";
        }else if(res == "ignore tf" | res == "igrone taks_id"){
          document.getElementById("login_error").classList.remove("non-visi");
          error("ERROR:データベースエラー","タスクの状態が誤っています。リロードして下さい");
        }else{
          document.getElementById("login_error").classList.remove("non-visi");
          document.getElementById("login_error").innerText = "ログイン情報が破損しています。再度ログインして下さい";
        }
      }else{
        error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
      }
    };
    xhr.onerror = function(){
      error("ERROR:サーバーが起動していません","何度かリロードを行った後、それでも動かないようでしたら担当者に連絡して下さい");
    }
    xhr.open('POST', "./get_pro", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(send_json);
  }
}