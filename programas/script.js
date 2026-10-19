// 1) Crie um projeto em supabase.com. Cole a Project URL e a chave anon/public abaixo.
const SUPABASE_URL = "https://omeohylvbrtoesbvgnhd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rJDKBLuZD84H9XNMtfLqmw_J6KJToNT";
const BUCKET = "cloud-photos";
let db, user, profile, activeGroup = null;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function toast(msg,error=false){const e=$("#toast");e.textContent=msg;e.className=error?"show error":"show";setTimeout(()=>e.className="",4000)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function initials(s="C"){return s.trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()}
function newCode(){const a=new Uint8Array(3);crypto.getRandomValues(a);return "CS-"+[...a].map(x=>x.toString(16).padStart(2,"0")).join("").toUpperCase()}
function err(e){let m=e?.message||"Erro inesperado";if(/Invalid login credentials/i.test(m))m="E-mail ou senha incorretos.";if(/Email not confirmed/i.test(m))m="Confirme seu e-mail antes de entrar.";if(/row-level security|permission denied/i.test(m))m="O banco bloqueou a ação. Confira as políticas do SQL.";if(/Bucket not found/i.test(m))m="Crie o bucket privado cloud-photos no Supabase.";return m}
function authMode(mode){$("#loginForm").classList.toggle("hidden",mode!=="login");$("#registerForm").classList.toggle("hidden",mode!=="register");$("#tabLogin").classList.toggle("active",mode==="login");$("#tabRegister").classList.toggle("active",mode==="register")}
async function getProfile(id=user.id){const {data,error}=await db.from("profiles").select("*").eq("id",id).maybeSingle();if(error)throw error;return data}
async function ensureProfile(u){let p=await getProfile(u.id);if(p)return p;for(let i=0;i<5;i++){const {data,error}=await db.from("profiles").insert({id:u.id,display_name:u.user_metadata?.display_name||u.email.split("@")[0],friend_code:newCode()}).select().single();if(!error)return data;if(!/duplicate|unique/i.test(error.message)||i===4)throw error}}

async function showApp(p) {
  profile = p;

  $("#auth").classList.add("hidden");
  $("#app").classList.remove("hidden");

  const name = p.display_name || user.email.split("@")[0];
  const avatarText = initials(name);

  $("#topName").textContent = name;
  $("#welcomeName").textContent = name.split(" ")[0];
  $("#profileName").textContent = name;
  $("#profileEmail").textContent = user.email;
  $("#profileId").textContent = p.friend_code || "";

  // Avatar do perfil
  $("#avatar").textContent = avatarText;

  // Dados da barra lateral
  $("#sidebarName").textContent = name;
  $("#sidebarAvatar").textContent = avatarText;
  $("#railAvatar").textContent = avatarText;

  go("home");
  await dashboard();
  await realtime();
}

async function restore(){const {data:{session}}=await db.auth.getSession();if(!session){$("#auth").classList.remove("hidden");$("#app").classList.add("hidden");return}user=session.user;try{await showApp(await ensureProfile(user))}catch(e){toast(err(e),true)}}
async function register(e){e.preventDefault();try{const {data,error}=await db.auth.signUp({email:$("#registerEmail").value.trim(),password:$("#registerPassword").value,options:{data:{display_name:$("#registerName").value.trim()}}});if(error)throw error;if(data.session){user=data.user;await showApp(await ensureProfile(user));toast("Conta criada!")}else{authMode("login");toast("Conta criada. Confirme o e-mail recebido e entre.")}}catch(e){toast(err(e),true)}}
async function login(e){e.preventDefault();try{const {data,error}=await db.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});if(error)throw error;user=data.user;await showApp(await ensureProfile(user));toast("Login realizado!")}catch(e){toast(err(e),true)}}

async function logout() {
  try {
    if (realtimeChannel) {
      await db.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    const { error } = await db.auth.signOut();
    if (error) throw error;

    user = null;
    profile = null;
    activeGroup = null;

    $("#app").classList.add("hidden");
    $("#auth").classList.remove("hidden");

    authMode("login");
    toast("Você saiu da sua conta.");
  } catch (e) {
    toast(err(e), true);
  }
}


function go(page) {
  const pages = ["home", "photos", "friends", "groups", "profile"];

  if (!pages.includes(page)) return;

  $$(".page").forEach(el => el.classList.add("hidden"));
  $("#" + page).classList.remove("hidden");

  $$("nav button[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    home: "Visão geral",
    photos: "Minhas fotos",
    friends: "Amigos",
    groups: "Grupos",
    profile: "Meu perfil"
  };

  $("#heading").textContent = titles[page];

  // Atualiza o botão selecionado na barra vertical
  $$(".server-rail [data-goto]").forEach(button => {
    button.classList.toggle("selected", button.dataset.goto === page);
  });

  if (page === "photos") loadPhotos();
  if (page === "friends") loadFriends();
  if (page === "groups") loadGroups();
}

async function dashboard(){try{const [p,f,g]=await Promise.all([db.from("photos").select("id",{count:"exact",head:true}).eq("owner_id",user.id).is("group_id",null),db.from("friendships").select("id",{count:"exact",head:true}).or(`user_a.eq.${user.id},user_b.eq.${user.id}`),db.from("group_members").select("group_id",{count:"exact",head:true}).eq("user_id",user.id)]);$("#photoCount").textContent=p.count||0;$("#friendCount").textContent=f.count||0;$("#groupCount").textContent=g.count||0;const {data,error}=await db.from("photos").select("*").eq("owner_id",user.id).is("group_id",null).order("created_at",{ascending:false}).limit(4);if(error)throw error;await gallery($("#recent"),data||[])}catch(e){console.error(e)}}
async function gallery(el,photos){el.innerHTML="";for(const p of photos){const {data,error}=await db.storage.from(BUCKET).createSignedUrl(p.storage_path,3600);if(error){console.error(error);continue}const b=document.createElement("button");b.className="photo";b.innerHTML=`<img src="${esc(data.signedUrl)}" alt="${esc(p.file_name)}"><span>${esc(p.file_name)}</span>`;b.onclick=()=>{$("#viewerImg").src=data.signedUrl;$("#viewerText").textContent=p.file_name;$("#viewer").showModal()};el.append(b)}}
async function upload(files,groupId=null){const list=[...files].filter(f=>f.type.startsWith("image/"));if(!list.length)return;if(list.some(f=>f.size>15*1024*1024))return toast("Cada imagem deve ter no máximo 15 MB.",true);toast("Enviando fotos…");let count=0;for(const f of list){try{const path=`${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g,"_")}`;let r=await db.storage.from(BUCKET).upload(path,f,{contentType:f.type});if(r.error)throw r.error;r=await db.from("photos").insert({owner_id:user.id,group_id:groupId,storage_path:path,file_name:f.name,mime_type:f.type,size_bytes:f.size});if(r.error){await db.storage.from(BUCKET).remove([path]);throw r.error}count++}catch(e){toast("Falha ao enviar foto: "+err(e),true)}}if(count)toast(`${count} foto(s) enviada(s)!`);if(groupId)await loadGroups();else await loadPhotos();await dashboard()}
async function loadPhotos(){const {data,error}=await db.from("photos").select("*").eq("owner_id",user.id).is("group_id",null).order("created_at",{ascending:false});if(error)return toast(err(error),true);await gallery($("#myPhotos"),data||[]);$("#emptyPhotos").classList.toggle("hidden",!!data?.length)}
async function idsFriends(){const {data,error}=await db.from("friendships").select("user_a,user_b").or(`user_a.eq.${user.id},user_b.eq.${user.id}`);if(error)throw error;return(data||[]).map(x=>x.user_a===user.id?x.user_b:x.user_a)}
async function profiles(ids){if(!ids.length)return[];const {data,error}=await db.from("profiles").select("id,display_name,friend_code").in("id",ids);if(error)throw error;return data||[]}
function channelpersonRow(p,extra=""){return `<div class="person"><div class="avatar">${esc(initials(p.display_name))}</div><div class="person-info"><strong>${esc(p.display_name)}</strong><small>${esc(p.friend_code||"")}</small></div>${extra}</div>`}
function personRow(p, extra = "") {
  return channelpersonRow(p, extra);
}
async function loadFriends(){try{const [ids,req]=await Promise.all([idsFriends(),db.from("friend_requests").select("*").eq("to_user",user.id).eq("status","pending").order("created_at",{ascending:false})]);if(req.error)throw req.error;const [ps,senders]=await Promise.all([profiles(ids),profiles((req.data||[]).map(r=>r.from_user))]);$("#friendsList").innerHTML=ps.length?ps.map(p=>personRow(p)).join(""):'<p class="empty">Você ainda não adicionou amigos.</p>';$("#requests").innerHTML=(req.data||[]).map(r=>{const p=senders.find(x=>x.id===r.from_user)||{display_name:"Usuário",friend_code:""};return personRow(p,`<button class="primary" data-accept="${r.id}">Aceitar</button><button class="secondary" data-reject="${r.id}">Recusar</button>`)}).join("")||'<p class="empty">Nenhum pedido pendente.</p>'}catch(e){toast(err(e),true)}}
async function sendRequest(e){e.preventDefault();const code=$("#friendId").value.trim().toUpperCase();if(code===profile.friend_code)return toast("Esse é seu próprio ID.",true);try{const {data:t,error}=await db.from("profiles").select("id,display_name").eq("friend_code",code).maybeSingle();if(error)throw error;if(!t)return toast("ID não encontrado.",true);const [a,b]=[user.id,t.id].sort();let r=await db.from("friendships").select("id").eq("user_a",a).eq("user_b",b).maybeSingle();if(r.error)throw r.error;if(r.data)return toast("Vocês já são amigos.",true);r=await db.from("friend_requests").select("id").eq("from_user",user.id).eq("to_user",t.id).eq("status","pending").maybeSingle();if(r.error)throw r.error;if(r.data)return toast("Pedido já enviado.",true);const {error:ins}=await db.from("friend_requests").insert({from_user:user.id,to_user:t.id});if(ins)throw ins;$("#friendId").value="";toast("Pedido enviado!")}catch(e){toast(err(e),true)}}
async function requestAction(id,accept){try{const {data:r,error}=await db.from("friend_requests").select("*").eq("id",id).eq("to_user",user.id).eq("status","pending").single();if(error)throw error;if(accept){const [a,b]=[r.from_user,user.id].sort();const {error:fe}=await db.from("friendships").insert({user_a:a,user_b:b});if(fe&&!/duplicate|unique/i.test(fe.message))throw fe}const {error:ue}=await db.from("friend_requests").update({status:accept?"accepted":"rejected"}).eq("id",id);if(ue)throw ue;toast(accept?"Amizade adicionada!":"Pedido recusado.");await loadFriends();await dashboard()}catch(e){toast(err(e),true)}}
async function loadGroups(){try{const {data:m,error}=await db.from("group_members").select("group_id").eq("user_id",user.id);if(error)throw error;const ids=(m||[]).map(x=>x.group_id);let gs=[];if(ids.length){const r=await db.from("groups").select("*").in("id",ids).order("created_at",{ascending:false});if(r.error)throw r.error;gs=r.data||[]}$("#groupsList").innerHTML=gs.map(g=>`<button class="group-button ${g.id===activeGroup?"active":""}" data-group="${g.id}">◉ &nbsp; ${esc(g.name)}</button>`).join("")||'<p class="empty">Você ainda não participa de grupos.</p>';if(activeGroup&&gs.some(g=>g.id===activeGroup))await showGroup(gs.find(g=>g.id===activeGroup));else if(gs.length){activeGroup=gs[0].id;await showGroup(gs[0])}else $("#groupDetail").textContent="Crie um grupo para começar."}catch(e){toast(err(e),true)}}
async function showGroup(g){const {data:mem,error:me}=await db.from("group_members").select("user_id").eq("group_id",g.id);if(me)throw me;const ps=await profiles((mem||[]).map(x=>x.user_id));const {data:photos,error}=await db.from("photos").select("*").eq("group_id",g.id).order("created_at",{ascending:false});if(error)throw error;$("#groupDetail").innerHTML=`<h3>${esc(g.name)}</h3><p class="muted">${ps.length} membro(s): ${ps.map(p=>esc(p.display_name)).join(", ")}</p><label class="primary upload">＋ Enviar fotos<input id="groupInput" type="file" accept="image/*" multiple hidden></label><div id="groupGallery" class="gallery" style="margin-top:15px"></div>${photos.length?"":'<p class="empty">Nenhuma foto no grupo ainda.</p>'}`;await gallery($("#groupGallery"),photos);$("#groupInput").onchange=e=>upload(e.target.files,g.id)}
async function newGroup(){try{const ids=await idsFriends(),ps=await profiles(ids);$("#friendChoices").innerHTML=ps.map(p=>`<label><input type="checkbox" name="chosen" value="${p.id}" style="width:auto"> ${esc(p.display_name)} (${esc(p.friend_code)})</label>`).join("")||'<p class="muted">Sem amigos ainda. Você pode criar o grupo só para você.</p>';$("#groupDialog").showModal()}catch(e){toast(err(e),true)}}
async function createGroup(e){e.preventDefault();try{const {data:g,error}=await db.from("groups").insert({name:$("#groupName").value.trim(),created_by:user.id}).select().single();if(error)throw error;const ids=[user.id,...$$('input[name="chosen"]:checked').map(x=>x.value)];const {error:me}=await db.from("group_members").insert(ids.map(user_id=>({group_id:g.id,user_id})));if(me)throw me;$("#groupDialog").close();$("#groupForm").reset();activeGroup=g.id;toast("Grupo criado!");await loadGroups();await dashboard()}catch(e){toast(err(e),true)}}
let realtimeChannel = null;

async function realtime() {
  if (!db || !user) return;

  // Remove a inscrição anterior, se existir.
  if (realtimeChannel) {
    await db.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  // Registra o evento ANTES de chamar subscribe().
  realtimeChannel = db
    .channel("cloud-space-" + user.id)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "group_members"
      },
      async () => {
        await dashboard();

        if (!$("#friends").classList.contains("hidden")) {
          await loadFriends();
        }

        if (!$("#groups").classList.contains("hidden")) {
          await loadGroups();
        }
      }
    )
    .subscribe((status) => {
      console.log("Cloud Space Realtime:", status);
    });
}

function bind() {
  $("#tabLogin").onclick = () => authMode("login");
  $("#tabRegister").onclick = () => authMode("register");

  $("#loginForm").onsubmit = login;
  $("#registerForm").onsubmit = register;
  $("#logout").onclick = logout;

  // Navegação lateral
  $$("nav button[data-page]").forEach(button => {
    button.onclick = () => go(button.dataset.page);
  });

  // Navegação por botões com data-goto
  $$("[data-goto]").forEach(button => {
    button.onclick = () => go(button.dataset.goto);
  });

  // Botão principal da barra vertical
  const homeButton = $(".server-home");
  if (homeButton) {
    homeButton.onclick = () => go("home");
  }

  // Upload de fotos pessoais
  $("#photoInput").onchange = event => {
    upload(event.target.files);
    event.target.value = "";
  };

  // Pedidos de amizade
  $("#friendForm").onsubmit = sendRequest;

  $("#requests").onclick = event => {
    const accept = event.target.closest("[data-accept]");
    const reject = event.target.closest("[data-reject]");

    if (accept) requestAction(accept.dataset.accept, true);
    if (reject) requestAction(reject.dataset.reject, false);
  };

  // Criar grupo pelos dois botões
  $("#newGroup").onclick = newGroup;

  const newGroupPage = $("#newGroupPage");
  if (newGroupPage) {
    newGroupPage.onclick = newGroup;
  }

  $("#groupForm").onsubmit = createGroup;
  $("#cancelGroup").onclick = () => $("#groupDialog").close();

  // Abrir grupos
  $("#groupsList").onclick = event => {
    const button = event.target.closest("[data-group]");
    if (!button) return;

    activeGroup = button.dataset.group;
    loadGroups();
  };

  // Copiar ID pessoal
  $("#copyId").onclick = async () => {
    try {
      await navigator.clipboard.writeText($("#profileId").textContent);
      toast("ID copiado!");
    } catch {
      toast("Não foi possível copiar automaticamente. Copie o ID manualmente.", true);
    }
  };

  // Visualizador de fotos
  $("#closeViewer").onclick = () => $("#viewer").close();
}

document.addEventListener("DOMContentLoaded",async()=>{bind();authMode("login");if(!SUPABASE_URL.startsWith("https://")||SUPABASE_ANON_KEY.startsWith("COLE_"))return toast("Configure URL e chave anon/public no script.js.",true);db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);db.auth.onAuthStateChange((event,session)=>{if(!session){user=profile=null;$("#app").classList.add("hidden");$("#auth").classList.remove("hidden")}else if(!user){user=session.user;setTimeout(()=>restore(),0)}});try{await restore()}catch(e){toast(err(e),true)}});
