// 先頭$ => DOM    全部大文字 => 定数
let now_process = false
let time_interval;
// チャート初期化用
let myChart = "A";

//  ナビゲーション切り替え機能
const NAV_NAME_LIST = ['top','work','share','pro','anl','info']
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
      localStorage.removeItem('WA-user');
      localStorage.removeItem('WA-key');
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
        get_data();
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
        var res = xhr.responseText;
        max_proj += 1
        create_project_select([{"project_id":max_proj,"name":pro_name}]);
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
const get_data = ()=>{
  var send_json = JSON.stringify({"user_id": user_data["id"],"local_storage_key": user_data["key"]})
  xhr = new XMLHttpRequest;
  xhr.onload = function(){
    if(xhr.status == 200){
      create_row(JSON.parse(xhr.responseText))
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
  dic["tasks"].forEach((e)=>{
    var $div = document.createElement("div")
    $div.setAttribute("class","task-row")
    var date = new Date(e[4]*1000)
    var date_text = `${date.getMonth()+1}/${("0"+String(date.getDate())).slice(-2)}（${weekDay[date.getDay()]}）${("0"+String(date.getHours())).slice(-2)}:${("0"+String(date.getMinutes())).slice(-2)}`
    var time_text = `${("0"+Math.floor(e[6]/3600)).slice(-2)}:${("0"+Math.floor((e[6]/60)%60)).slice(-2)}:${("0"+e[6]%60).slice(-2)}`
    $div.innerHTML = `<div class="task_done">□</div><div class="task_name">${e[2]}</div><div class="task_pro">${e[3]}</div>
    <div class="task_dead">${date_text}</div><div class="task_pre">${time_text}</div>
    <div class="task_del">…</div>`
    $row_hand.appendChild($div)
  })
}