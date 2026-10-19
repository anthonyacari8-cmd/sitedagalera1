/* NEXORA — complemento: avatar de perfil, autoria das fotos e gestão de grupos.
   Cole este bloco NO FINAL do script.js atual, depois de todo o código existente. */

const NEXORA_AVATAR_BUCKET = "cloud-photos";

function avatarMarkup(person, className = "avatar") {
  const name = person?.display_name || "Usuário";
  const path = person?.avatar_path;
  const fallback = initials(name);
  const url = person?._avatarUrl;
  return url
    ? `<div class="${className} avatar-image"><img src="${esc(url)}" alt="Foto de perfil de ${esc(name)}"></div>`
    : `<div class="${className}">${esc(fallback)}</div>`;
}

async function avatarUrl(path) {
  if (!path) return "";
  const { data, error } = await db.storage.from(NEXORA_AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error) {
    console.warn("Não foi possível carregar a foto de perfil:", error.message);
    return "";
  }
  return data?.signedUrl || "";
}

async function updateAvatarDisplays() {
  if (!profile || !user) return;
  const url = await avatarUrl(profile.avatar_path);
  const name = profile.display_name || user.email.split("@")[0];
  const html = url
    ? `<img src="${esc(url)}" alt="Foto de perfil">`
    : esc(initials(name));

  ["#avatar", "#sidebarAvatar", "#railAvatar"].forEach(selector => {
    const el = $(selector);
    if (!el) return;
    el.classList.add("avatar-image");
    el.innerHTML = html;
  });
}

async function uploadProfileAvatar(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast("Escolha um arquivo de imagem.", true);
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast("A foto de perfil deve ter no máximo 5 MB.", true);
    return;
  }

  try {
    toast("Atualizando foto de perfil…");
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^\w]/g, "").slice(0, 8) || "jpg";
    const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await db.storage.from(NEXORA_AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const oldPath = profile.avatar_path;
    const { data, error } = await db.from("profiles")
      .update({ avatar_path: path })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      await db.storage.from(NEXORA_AVATAR_BUCKET).remove([path]);
      throw error;
    }

    profile = data;
    await updateAvatarDisplays();
    toast("Foto de perfil atualizada!");
    if (oldPath && oldPath !== path) {
      const { error: removeError } = await db.storage.from(NEXORA_AVATAR_BUCKET).remove([oldPath]);
      if (removeError) console.warn("A foto antiga permaneceu no Storage:", removeError.message);
    }
    if (!$("#friends").classList.contains("hidden")) await loadFriends();
    if (!$("#groups").classList.contains("hidden")) await loadGroups();
  } catch (e) {
    toast(err(e), true);
  }
}

/* Recria os cartões de pessoas com avatar real, quando houver. */
async function channelpersonRow(p, extra = "") {
  const url = await avatarUrl(p.avatar_path);
  const person = { ...p, _avatarUrl: url };
  return `<div class="person">
    ${avatarMarkup(person)}
    <div class="person-info"><strong>${esc(p.display_name || "Usuário")}</strong>
    <small>${esc(p.friend_code || "")}</small></div>${extra}</div>`;
}
async function personRowsHtml(list, extraFor = () => "") {
  return (await Promise.all(list.map(async p => channelpersonRow(p, extraFor(p))))).join("");
}

/* Inclui avatar_path nas consultas de perfis. */
async function profiles(ids) {
  if (!ids.length) return [];
  const { data, error } = await db.from("profiles")
    .select("id,display_name,friend_code,avatar_path").in("id", ids);
  if (error) throw error;
  const people = data || [];
  await Promise.all(people.map(async p => { p._avatarUrl = await avatarUrl(p.avatar_path); }));
  return people;
}

async function loadFriends() {
  try {
    const [ids, req] = await Promise.all([
      idsFriends(),
      db.from("friend_requests").select("*").eq("to_user", user.id)
        .eq("status", "pending").order("created_at", { ascending: false })
    ]);
    if (req.error) throw req.error;
    const [ps, senders] = await Promise.all([
      profiles(ids),
      profiles((req.data || []).map(r => r.from_user))
    ]);

    $("#friendsList").innerHTML = ps.length
      ? await personRowsHtml(ps)
      : '<p class="empty">Você ainda não adicionou amigos.</p>';

    const requestsHtml = await Promise.all((req.data || []).map(async r => {
      const p = senders.find(x => x.id === r.from_user) || {
        display_name: "Usuário", friend_code: "", avatar_path: null
      };
      return channelpersonRow(p,
        `<button class="primary" data-accept="${esc(r.id)}">Aceitar</button>
         <button class="secondary" data-reject="${esc(r.id)}">Recusar</button>`);
    }));
    $("#requests").innerHTML = requestsHtml.join("") || '<p class="empty">Nenhum pedido pendente.</p>';
  } catch (e) { toast(err(e), true); }
}

/* Fotos de grupo exibem autor, avatar e horário. */
async function gallery(el, photos, showAuthor = false) {
  el.innerHTML = "";
  if (!photos?.length) return;
  const authorIds = showAuthor ? [...new Set(photos.map(p => p.owner_id).filter(Boolean))] : [];
  let authorMap = new Map();
  if (authorIds.length) {
    const people = await profiles(authorIds);
    authorMap = new Map(people.map(p => [p.id, p]));
  }

  for (const p of photos) {
    try {
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(p.storage_path, 3600);
      if (error) throw error;
      const b = document.createElement("button");
      b.className = "photo";
      const author = authorMap.get(p.owner_id);
      const authorName = author?.display_name || "Participante";
      const time = p.created_at ? new Date(p.created_at).toLocaleString("pt-BR", {
        dateStyle: "short", timeStyle: "short"
      }) : "";
      b.innerHTML = `<img src="${esc(data.signedUrl)}" alt="${esc(p.file_name || "Foto")}">
        ${showAuthor ? `<span class="photo-author">${avatarMarkup(author || {display_name: authorName}, "avatar photo-author-avatar")}
          <span><strong>${esc(authorName)}</strong><small>${esc(time)}</small></span></span>` : ""}
        <span>${esc(p.file_name || "Foto")}</span>`;
      b.onclick = () => {
        $("#viewerImg").src = data.signedUrl;
        $("#viewerText").textContent = showAuthor
          ? `${p.file_name || "Foto"} • Enviada por ${authorName}${time ? " • " + time : ""}`
          : (p.file_name || "Foto");
        $("#viewer").showModal();
      };
      el.append(b);
    } catch (e) { console.error("Falha ao carregar foto:", e); }
  }
}

/* Recarrega o perfil ao entrar e atualiza os avatares na interface. */
const nexoraOriginalShowApp = showApp;
showApp = async function(p) {
  await nexoraOriginalShowApp(p);
  await updateAvatarDisplays();
};

/* Permissões de interface: criador do grupo pode editar ou excluir. 
   As políticas RLS do SQL complementar continuam sendo a proteção real. */
async function showGroup(g) {
  const { data: mem, error: me } = await db.from("group_members")
    .select("user_id").eq("group_id", g.id);
  if (me) throw me;
  const ps = await profiles((mem || []).map(x => x.user_id));
  const { data: photos, error } = await db.from("photos").select("*")
    .eq("group_id", g.id).order("created_at", { ascending: false });
  if (error) throw error;

  const isCreator = g.created_by === user.id;
  const groupAvatar = g.avatar_path ? await avatarUrl(g.avatar_path) : "";
  $("#groupDetail").innerHTML = `
    <div class="group-detail-head">
      <div class="group-title-wrap">
        ${groupAvatar ? `<img class="group-avatar" src="${esc(groupAvatar)}" alt="">` : '<div class="group-avatar group-avatar-fallback">◈</div>'}
        <div><h3>${esc(g.name)}</h3><p class="muted">${ps.length} membro(s): ${ps.map(p => esc(p.display_name)).join(", ")}</p></div>
      </div>
      ${isCreator ? `<div class="group-management">
        <button type="button" class="secondary" id="editActiveGroup">Editar grupo</button>
        <button type="button" class="danger" id="deleteActiveGroup">Excluir grupo</button>
      </div>` : ""}
    </div>
    <label class="primary upload">＋ Enviar fotos
      <input id="groupInput" type="file" accept="image/*" multiple hidden>
    </label>
    <div id="groupGallery" class="gallery" style="margin-top:15px"></div>
    ${photos.length ? "" : '<p class="empty">Nenhuma foto no grupo ainda.</p>'}`;

  await gallery($("#groupGallery"), photos || [], true);
  const input = $("#groupInput");
  if (input) input.onchange = e => {
    upload(e.target.files, g.id);
    e.target.value = "";
  };
  const edit = $("#editActiveGroup");
  if (edit) edit.onclick = () => openEditGroup(g);
  const del = $("#deleteActiveGroup");
  if (del) del.onclick = () => deleteGroup(g);
}

async function openEditGroup(g) {
  const dialog = $("#editGroupDialog");
  if (!dialog) return toast("Falta adicionar o modal de edição ao HTML.", true);
  $("#editGroupId").value = g.id;
  $("#editGroupName").value = g.name || "";
  $("#editGroupAvatar").value = "";
  dialog.showModal();
}

async function saveGroupEdit(e) {
  e.preventDefault();
  const id = $("#editGroupId").value;
  const name = $("#editGroupName").value.trim();
  if (name.length < 2 || name.length > 50) return toast("O nome deve ter entre 2 e 50 caracteres.", true);

  try {
    const { data: group, error: fetchError } = await db.from("groups")
      .select("*").eq("id", id).eq("created_by", user.id).single();
    if (fetchError) throw fetchError;

    let avatarPath = group.avatar_path || null;
    const file = $("#editGroupAvatar").files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem para o grupo.");
      if (file.size > 5 * 1024 * 1024) throw new Error("A imagem do grupo deve ter no máximo 5 MB.");
      const ext = (file.name.split(".").pop() || "jpg").replace(/[^\w]/g, "").slice(0, 8) || "jpg";
      const newPath = `${user.id}/groups/${id}-${crypto.randomUUID()}.${ext}`;
      const { error: upError } = await db.storage.from(BUCKET).upload(newPath, file, { contentType: file.type });
      if (upError) throw upError;
      avatarPath = newPath;
    }

    const { error } = await db.from("groups").update({ name, avatar_path: avatarPath })
      .eq("id", id).eq("created_by", user.id);
    if (error) throw error;

    if (file && group.avatar_path && group.avatar_path !== avatarPath) {
      const { error: rmError } = await db.storage.from(BUCKET).remove([group.avatar_path]);
      if (rmError) console.warn("Não foi possível remover a imagem antiga do grupo:", rmError.message);
    }
    $("#editGroupDialog").close();
    toast("Grupo atualizado!");
    await loadGroups();
  } catch (e) { toast(err(e), true); }
}

async function deleteGroup(g) {
  if (g.created_by !== user.id) return toast("Somente quem criou o grupo pode excluí-lo.", true);
  const ok = confirm(`Excluir o grupo "${g.name}"? Esta ação não poderá ser desfeita.`);
  if (!ok) return;

  try {
    const { data: rows, error: photoError } = await db.from("photos")
      .select("id,storage_path").eq("group_id", g.id);
    if (photoError) throw photoError;

    const paths = (rows || []).map(p => p.storage_path).filter(Boolean);
    // Exclui os registros do grupo primeiro; RLS deve permitir ao criador/admin.
    const { error: deletePhotosError } = await db.from("photos").delete().eq("group_id", g.id);
    if (deletePhotosError) throw deletePhotosError;
    if (paths.length) {
      const { error: storageError } = await db.storage.from(BUCKET).remove(paths);
      if (storageError) console.warn("Algumas imagens podem ter permanecido no Storage:", storageError.message);
    }
    const { error: membersError } = await db.from("group_members").delete().eq("group_id", g.id);
    if (membersError) throw membersError;
    const { error: groupError } = await db.from("groups").delete()
      .eq("id", g.id).eq("created_by", user.id);
    if (groupError) throw groupError;

    activeGroup = null;
    toast("Grupo excluído.");
    await loadGroups();
    await dashboard();
  } catch (e) {
    toast("Não foi possível excluir o grupo: " + err(e), true);
  }
}

/* Liga os novos controles depois do bind original. */
const nexoraOriginalBind = bind;
bind = function() {
  nexoraOriginalBind();
  const avatarInput = $("#avatarInput");
  if (avatarInput) avatarInput.onchange = e => {
    uploadProfileAvatar(e.target.files?.[0]);
    e.target.value = "";
  };
  const editForm = $("#editGroupForm");
  if (editForm) editForm.onsubmit = saveGroupEdit;
  const cancelEdit = $("#cancelEditGroup");
  if (cancelEdit) cancelEdit.onclick = () => $("#editGroupDialog").close();
};
