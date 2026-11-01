(() => {
  const $ = id => document.getElementById(id);
  const defaults = {p1:12,p2:9,p3:8,p4:7,p5:6,p6:5,p7:4,p8:3,p9:2,p10:1,p11:0,killPoint:1};
  const storageKey = "veronPointKlasemen_v1";
  let teams = [];
  let nextId = 1;
  let toastTimer;
  function numberValue(id) { const value=Number($(id).value); return Number.isFinite(value)&&value>=0?value:0; }
  function placementPoints(rank) { return numberValue(rank<=10?"p"+rank:"p11"); }
  function safeText(value) { return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
  function showToast(message) { const toast=$("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2200); }
  function addTeam(data={}) { const id=nextId++;teams.push({id,name:data.name||"",placement:Number(data.placement)||1,kills:Number(data.kills)||0});renderTeamRows();update(); }
  function renderTeamRows() {
    $("teamList").innerHTML=teams.map((team,index)=>`<div class="team-row" data-id="${team.id}">
      <input class="team-name" type="text" maxlength="40" aria-label="Nama tim" placeholder="Nama Tim ${index+1}" value="${safeText(team.name)}">
      <select class="team-placement" aria-label="Placement">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===team.placement?"selected":""}>#${n}</option>`).join("")}</select>
      <input class="team-kills" type="number" min="0" step="1" aria-label="Jumlah kill" value="${team.kills}">
      <span class="score">0</span><button class="delete-btn" type="button" aria-label="Hapus tim" title="Hapus tim">×</button></div>`).join("");
  }
  function readRows() { document.querySelectorAll(".team-row").forEach(row=>{const team=teams.find(t=>t.id===Number(row.dataset.id));if(!team)return;team.name=row.querySelector(".team-name").value;team.placement=Math.min(12,Math.max(1,Number(row.querySelector(".team-placement").value)||1));team.kills=Math.max(0,Math.floor(Number(row.querySelector(".team-kills").value)||0));}); }
  function computedTeams() { return teams.map((team,index)=>{const rankPoints=placementPoints(team.placement);const killPoints=team.kills*numberValue("killPoint");return {...team,name:team.name.trim()||`Tim ${index+1}`,placementPoints:rankPoints,killPoints,total:rankPoints+killPoints};}).sort((a,b)=>b.total-a.total||b.kills-a.kills||a.placement-b.placement); }
  function renderBoard(results) {
    $("leaderboardBody").innerHTML=results.length?results.map((t,i)=>`<tr><td class="${i<3?"rank-"+(i+1):""}">${["🥇","🥈","🥉"][i]||""} #${i+1}</td><td><strong>${safeText(t.name)}</strong></td><td>#${t.placement}</td><td>${t.kills}</td><td>${t.placementPoints}</td><td>${t.killPoints}</td><td>${t.total}</td></tr>`).join(""):'<tr><td colspan="7" class="empty">Tambahkan tim untuk memulai klasemen.</td></tr>';
    $("teamCount").textContent=results.length;$("killCount").textContent=results.reduce((sum,t)=>sum+t.kills,0);$("topScore").textContent=results[0]?.total??0;
    document.querySelectorAll(".team-row").forEach(row=>{const team=results.find(t=>t.id===Number(row.dataset.id));row.querySelector(".score").textContent=team?team.total:0;});
  }
  function save() { const state={teams,points:Object.fromEntries(Object.keys(defaults).map(k=>[k,$(k).value]))};try{localStorage.setItem(storageKey,JSON.stringify(state));$("saveStatus").textContent="✓ Tersimpan otomatis";}catch(e){$("saveStatus").textContent="Penyimpanan browser tidak tersedia";} }
  function update() { readRows();renderBoard(computedTeams());save(); }
  function restore() {
    try{const state=JSON.parse(localStorage.getItem(storageKey)||"null");if(state?.points)Object.keys(defaults).forEach(k=>{if(state.points[k]!==undefined)$(k).value=state.points[k];});if(Array.isArray(state?.teams)&&state.teams.length)teams=state.teams.map(t=>({id:nextId++,name:String(t.name||""),placement:Number(t.placement)||1,kills:Number(t.kills)||0}));}catch(e){localStorage.removeItem(storageKey);}
    if(!teams.length){for(let i=0;i<4;i++)addTeam();}else{renderTeamRows();update();}
  }
  function exportCSV() {
    update();const results=computedTeams();if(!results.length)return showToast("Belum ada data untuk diekspor.");
    const quote=value=>`"${String(value).replace(/"/g,'""')}"`;const lines=[["Rank","Nama Tim","Placement","Kills","Poin Placement","Poin Kill","Total"],...results.map((t,i)=>[i+1,t.name,t.placement,t.kills,t.placementPoints,t.killPoints,t.total])];
    const csv="\uFEFF"+lines.map(row=>row.map(quote).join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="klasemen-veron-point.csv";link.click();URL.revokeObjectURL(url);showToast("CSV berhasil diunduh.");
  }
  $("addTeam").addEventListener("click",()=>addTeam());
  $("teamList").addEventListener("input",update);$("teamList").addEventListener("change",update);
  $("teamList").addEventListener("click",event=>{const button=event.target.closest(".delete-btn");if(!button)return;const id=Number(button.closest(".team-row").dataset.id);teams=teams.filter(t=>t.id!==id);renderTeamRows();update();});
  $("pointConfig").addEventListener("input",update);
  $("calculate").addEventListener("click",()=>{update();showToast("Poin berhasil dihitung.");});
  $("export").addEventListener("click",exportCSV);
  $("defaultPoints").addEventListener("click",()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);update();showToast("Aturan poin dikembalikan ke default.");});
  $("reset").addEventListener("click",()=>{if(!confirm("Hapus semua data dan kembalikan aturan poin ke default?"))return;teams=[];nextId=1;Object.entries(defaults).forEach(([k,v])=>$(k).value=v);for(let i=0;i<4;i++)addTeam();showToast("Data berhasil direset.");});

  $("year").textContent=new Date().getFullYear();restore();
})();