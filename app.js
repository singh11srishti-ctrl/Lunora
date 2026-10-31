const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function hideSplash(){const s=document.getElementById("splash");if(!s)return;setTimeout(()=>{s.classList.add("gone");setTimeout(()=>s.remove(),600)},Math.max(0,1500-performance.now()))}
setTimeout(hideSplash,6000);
const cfg=window.LUNORA||{};
if(!cfg.url||cfg.url.startsWith("YOUR")){$("#setup").hidden=false;hideSplash();throw new Error("Add Supabase keys to config.js")}
const sb=supabase.createClient(cfg.url,cfg.key);
let user=null,prof=null;
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const show=id=>["auth","onboard","app"].forEach(s=>$("#"+s).hidden=s!==id);
const msg=(el,t,ok)=>{el.textContent=t;el.classList.toggle("ok",!!ok)};
const PURPOSES=[["pcos","PCOS or PCOD","Daily plan to manage symptoms like irregular cycles, skin and fatigue"],["period","Period tracking only","Log your cycle and see your patterns"],["menopause","Menopause","Track symptoms and get gentle daily support"],["fertility","Fertility","Understand your cycle and prepare your body"],["pregnancy","Pregnancy","Simple daily habits for you and your baby"]];
const GOALS={pcos:["Regular cycles","Weight","Skin","Mood and energy"],period:["Understand my cycle","Regular cycles","Mood and energy","Skin"],menopause:["Hot flushes","Better sleep","Mood and energy","Bone health"],fertility:["Track ovulation","Regular cycles","Nutrition","Stress"],pregnancy:["Healthy nutrition","Gentle movement","Better sleep","Stress"]};
const pkey=()=>(PURPOSES.find(p=>p[1]===prof.status)||PURPOSES[0])[0];
function cards(box,radio){box.innerHTML="";PURPOSES.forEach(([k,l,d])=>{const e=document.createElement(radio?"label":"div");e.className="opt";
 e.innerHTML=(radio?'<input type="radio" name="purpose" required>':"")+"<b></b><span></span>";e.querySelector("b").textContent=l;e.querySelector("span").textContent=d;if(radio)e.querySelector("input").value=l;box.append(e)})}
cards($("#home-p"),false);cards($("#ob-p"),true);
$("#h-up").onclick=()=>$("#t-up").click();$("#p-in").onclick=()=>$("#t-in").click();$("#p-up").onclick=()=>$("#t-up").click();

/* auth */
$("#t-in").onclick=()=>{$("#f-in").hidden=false;$("#f-up").hidden=true;$("#t-in").className="primary";$("#t-up").className=""};
$("#t-up").onclick=()=>{$("#f-in").hidden=true;$("#f-up").hidden=false;$("#t-up").className="primary";$("#t-in").className=""};
$("#f-in").onsubmit=async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:$("#in-e").value,password:$("#in-p").value});msg($("#amsg"),error?error.message:"")};
$("#f-up").onsubmit=async e=>{e.preventDefault();const{data,error}=await sb.auth.signUp({email:$("#up-e").value,password:$("#up-p").value,options:{data:{name:$("#up-n").value}}});
 msg($("#amsg"),error?error.message:(data.session?"":"Check your email to confirm your account, then sign in."))};
$("#out").onclick=()=>sb.auth.signOut();
sb.auth.onAuthStateChange((_,s)=>{user=s?s.user:null;route().finally(hideSplash)});
async function route(){
 $("#out").hidden=$("#appnav").hidden=!user;$("#pub").hidden=!!user;
 if(!user){show("auth");return}
 const{data}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();prof=data;
 if(!prof){show("onboard");return}
 show("app");renderToday()}

/* onboarding */
let obStep=1;
function obShow(){$("#ob1").hidden=obStep!==1;$("#ob2").hidden=obStep!==2;$("#ob-back").hidden=obStep===1;$("#ob-next").textContent=obStep===1?"Continue":"Create my plan";
 $("#ob-s").textContent="Step "+obStep+" of 2. You can change this later.";$("#ob-h").textContent=obStep===1?"What are you using Lunora for?":"A few details";
 $("#ob-age").required=obStep===2}
$("#ob-back").onclick=()=>{obStep=1;obShow()}; obShow();
$("#f-ob").onsubmit=async e=>{e.preventDefault();
 const sel=$("#ob-p input:checked");if(!sel)return;
 if(obStep===1){const k=PURPOSES.find(p=>p[1]===sel.value)[0];const g=$("#ob-goals");g.innerHTML="<legend>What do you want to focus on?</legend>";
  GOALS[k].forEach(x=>{const l=document.createElement("label");l.className="ck";l.innerHTML='<input type="checkbox"><span></span>';l.firstChild.value=x;l.lastChild.textContent=x;g.append(l)});obStep=2;obShow();return}
 const row={id:user.id,name:user.user_metadata.name||"",age:+$("#ob-age").value,status:sel.value,diet:$("#ob-diet").value,level:$("#ob-lv").value,goals:$$("#ob-goals input:checked").map(i=>i.value)};
 const{error}=await sb.from("profiles").upsert(row);if(error)alert(error.message);else{obStep=1;obShow();route()}};

/* tabs */
$$("#appnav button").forEach(b=>b.onclick=()=>{$$("#appnav button").forEach(x=>x.classList.toggle("on",x===b));$$(".tab").forEach(t=>t.classList.toggle("on",t.id==="tab-"+b.dataset.t));
 ({today:renderToday,log:loadLog,insights:renderInsights,report:renderReport,cycle:renderCycle,comm:loadFeed}[b.dataset.t]||(()=>{}))()});

/* today */
const BF={Vegetarian:"Moong chilla with curd",Eggetarian:"Veg omelette with sprouts",["Non-vegetarian"]:"Egg bhurji with a slice of multigrain toast",Vegan:"Tofu scramble with vegetables"};
const planItems=()=>{const k=pkey(),last={pregnancy:["Took your supplements as your doctor advised","Tick this when done."],menopause:["Did something kind for your bones or mood","A walk, stretching or time outside all count."]}[k]||["Took a few minutes for yourself","Rest, breathe or do something you enjoy."];
 return [["bf","Had a balanced breakfast","Tick this when you have eaten."],["move","Moved your body today","Any movement you enjoy counts."],["water","Stayed hydrated","Tick this when you have had enough water for you."],["sleep","Got enough rest","Listen to what your body needs."],["last",...last]]};
async function renderToday(){
 $("#hi").textContent="Hello, "+(prof.name||"there");
 $("#focus").textContent=prof.goals.length?"Your focus: "+prof.goals.join(", ").toLowerCase():"";
 const{data}=await sb.from("plan_progress").select("*").eq("day",today()).maybeSingle();let done=data?data.done:[];
 const ul=$("#plan");ul.innerHTML="";
 planItems().forEach(([k,t,s])=>{const li=document.createElement("li"),l=document.createElement("label"),c=document.createElement("input");
  c.type="checkbox";c.checked=done.includes(k);const d=document.createElement("div");d.innerHTML="<b></b><span></span>";d.firstChild.textContent=t;d.lastChild.textContent=s;
  c.onchange=async()=>{done=c.checked?[...done,k]:done.filter(x=>x!==k);paint();await sb.from("plan_progress").upsert({user_id:user.id,day:today(),done});streak()};
  l.append(c,d);li.append(l);ul.append(li)});
 const paint=()=>$("#prog").style.width=done.length/5*100+"%";paint();streak()}
async function streak(){
 const{data}=await sb.from("plan_progress").select("day,done").order("day",{ascending:false}).limit(60);const full=new Set((data||[]).filter(r=>r.done.length>=5).map(r=>r.day));
 let n=0,d=new Date();if(!full.has(today()))d.setDate(d.getDate()-1);
 while(full.has(new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
 $("#streak").textContent=n+" day streak"}

/* log */
async function loadLog(){const{data:r}=await sb.from("logs").select("*").eq("day",today()).maybeSingle();if(!r)return;
 $("#l-mood").value=r.mood;$("#l-skin").value=r.skin;$("#l-sleep").value=r.sleep??"";$("#l-water").value=r.water??"";$("#l-w").value=r.weight??"";$("#l-period").checked=r.period;$("#l-sugar").checked=r.sugar}
$("#f-log").onsubmit=async e=>{e.preventDefault();
 const{error}=await sb.from("logs").upsert({user_id:user.id,day:today(),mood:+$("#l-mood").value,skin:+$("#l-skin").value,sleep:$("#l-sleep").value||null,water:$("#l-water").value||null,weight:$("#l-w").value||null,period:$("#l-period").checked,sugar:$("#l-sugar").checked});
 msg($("#lmsg"),error?error.message:"Saved.",!error)};
$("#sample").onclick=async()=>{const rows=[];for(let i=1;i<=21;i++){const d=new Date();d.setDate(d.getDate()-i);const sl=5+Math.round(Math.random()*40)/10,su=Math.random()<.35;
 rows.push({user_id:user.id,day:new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),sleep:sl,sugar:su,mood:Math.max(1,Math.min(5,Math.round(sl-3+Math.random()))),skin:Math.max(1,Math.min(5,su?2+Math.round(Math.random()):4-Math.round(Math.random()))),water:4+Math.floor(Math.random()*6),period:i>17,weight:null})}
 const{error}=await sb.from("logs").upsert(rows);msg($("#lmsg"),error?error.message:"Sample data loaded. Open Insights.",!error)};

/* insights + report */
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
async function getLogs(){const{data}=await sb.from("logs").select("*").order("day",{ascending:false}).limit(60);return data||[]}
async function renderInsights(){const L=await getLogs(),box=$("#ins");box.innerHTML="";
 if(L.length<7){box.innerHTML='<p class="muted">Log at least a week to see patterns. You can load sample data on the Log tab.</p>';return}
 const out=[],pair=(t,a,b,u)=>{const x=avg(a),y=avg(b);if(x!=null&&y!=null)out.push(t+": "+x.toFixed(1)+" "+u+" vs "+y.toFixed(1)+".")};
 pair("Mood on nights with 7+ hours of sleep vs less",L.filter(l=>l.sleep>=7).map(l=>l.mood),L.filter(l=>l.sleep<7).map(l=>l.mood),"out of 5");
 pair("Skin score on low-sugar days vs high-sugar days",L.filter(l=>!l.sugar).map(l=>l.skin),L.filter(l=>l.sugar).map(l=>l.skin),"out of 5");
 const w=avg(L.map(l=>l.water).filter(x=>x!=null));if(w!=null)out.push("You average "+w.toFixed(1)+" glasses of water a day.");
 out.forEach(t=>{const p=document.createElement("div");p.className="pat";p.textContent=t;box.append(p)})}
async function renderReport(){const L=await getLogs(),r=$("#rep");
 r.innerHTML='<div class="card"><h2></h2><p id="rs"></p><table><thead><tr><th>Date</th><th>Mood</th><th>Skin</th><th>Sleep</th><th>Water</th><th>Period</th><th>Sugar</th></tr></thead><tbody></tbody></table></div>';
 r.querySelector("h2").textContent=(prof.name||"Patient")+", age "+prof.age;$("#rs").textContent=prof.status+". Diet: "+prof.diet.toLowerCase()+". Activity: "+prof.level.toLowerCase()+".";
 L.slice(0,30).forEach(l=>{const tr=document.createElement("tr");[l.day,l.mood,l.skin,l.sleep??"-",l.water??"-",l.period?"Yes":"",l.sugar?"Yes":""].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td)});r.querySelector("tbody").append(tr)})}

/* cycle calendar */
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
let cs={start:"",cl:28,pl:5},cm=new Date(),logP=new Set();cm.setDate(1);
async function renderCycle(){const{data}=await sb.from("cycle_settings").select("*").maybeSingle();if(data)cs={start:data.last_start||"",cl:data.cycle_len,pl:data.period_len};
 $("#c-start").max=iso(new Date());
 if(cs.start>iso(new Date())){cs.start="";msg($("#cmsg"),"Your saved date was in the future, so I cleared it. Please pick the day your last period started.")}
 const{data:L}=await sb.from("logs").select("day").eq("period",true);logP=new Set((L||[]).map(r=>r.day));
 $("#c-start").value=cs.start;$("#c-cl").textContent=cs.cl;$("#c-pl").textContent=cs.pl;drawCal()}
$$(".stp").forEach(b=>b.onclick=()=>{const k=b.dataset.k,lim=k==="cl"?[20,45]:[2,10];cs[k]=Math.max(lim[0],Math.min(lim[1],cs[k]+ +b.dataset.d));$("#c-"+k).textContent=cs[k];drawCal()});
$("#c-start").onchange=e=>{cs.start=e.target.value;msg($("#cmsg"),"");drawCal();if(cs.start){const d=new Date(cs.start+"T00:00");cm=new Date(d.getFullYear(),d.getMonth(),1);drawCal()}};
$("#c-prev").onclick=()=>{cm.setMonth(cm.getMonth()-1);drawCal()};$("#c-next").onclick=()=>{cm.setMonth(cm.getMonth()+1);drawCal()};
$("#c-save").onclick=async()=>{if(!cs.start){msg($("#cmsg"),"Pick the date your last period started.");return}
 const{error}=await sb.from("cycle_settings").upsert({user_id:user.id,last_start:cs.start,cycle_len:cs.cl,period_len:cs.pl});msg($("#cmsg"),error?error.message:"Cycle updated.",!error)};
function drawCal(){const g=$("#c-grid");g.innerHTML="";$("#c-title").textContent=cm.toLocaleString("en",{month:"long",year:"numeric"});
 "SMTWTFS".split("").forEach(l=>{const h=document.createElement("small");h.textContent=l;g.append(h)});
 for(let i=0;i<cm.getDay();i++)g.append(document.createElement("span"));
 const n=new Date(cm.getFullYear(),cm.getMonth()+1,0).getDate(),tod=iso(new Date()),ov=cs.cl-14;
 for(let d=1;d<=n;d++){const ds=iso(new Date(cm.getFullYear(),cm.getMonth(),d)),c=[];
  if(cs.start&&ds>=cs.start){const o=Math.round((Date.parse(ds)-Date.parse(cs.start))/864e5)%cs.cl;
   if(o<cs.pl)c.push(ds>tod?"e":"p");else if(o===ov)c.push("o");else if(o>=ov-5&&o<=ov+1)c.push("f");else if(o>=cs.cl-5)c.push("m")}
  if(logP.has(ds))c.push("p");if(ds===tod)c.push("t");
  const x=document.createElement("span");x.className=c.join(" ");x.textContent=d;g.append(x)}}

/* community */
const TOPICS=["PCOS or PCOD","Periods","Menopause","Fertility","Pregnancy","General"];
TOPICS.forEach(t=>{["#cm-t","#cm-f"].forEach(s=>{const o=document.createElement("option");o.textContent=t;$(s).append(o)})});
{const o=document.createElement("option");o.value="";o.textContent="All topics";$("#cm-f").prepend(o);$("#cm-f").value=""}
$("#cm-f").onchange=loadFeed;
$("#f-cm").onsubmit=async e=>{e.preventDefault();const b=$("#cm-b").value.trim();if(!b)return;
 const{error}=await sb.from("posts").insert({topic:$("#cm-t").value,body:b});if(error)alert(error.message);else{$("#cm-b").value="";loadFeed()}};
async function loadFeed(){const f=$("#cm-f").value;let q=sb.from("feed").select("*").order("created_at",{ascending:false}).limit(50);if(f)q=q.eq("topic",f);
 const{data}=await q,box=$("#feed");box.innerHTML="";if(!data||!data.length){box.innerHTML='<p class="muted">No posts yet. Be the first to share what worked for you.</p>';return}
 data.forEach(p=>{const d=document.createElement("div");d.className="post";d.innerHTML='<span class="chip"></span> <small class="muted"></small><p></p><div class="acts"></div>';
  d.querySelector(".chip").textContent=p.topic;d.querySelector("small").textContent=new Date(p.created_at).toLocaleDateString();d.querySelector("p").textContent=p.body;
  const a=d.querySelector(".acts"),btn=(t,fn)=>{const b=document.createElement("button");b.textContent=t;b.onclick=fn;a.append(b)};
  btn((p.liked?"Helped you":"This helped me")+" ("+p.likes+")",async()=>{if(p.liked)await sb.from("post_likes").delete().eq("post_id",p.id).eq("user_id",user.id);else await sb.from("post_likes").insert({post_id:p.id});loadFeed()});
  if(p.mine)btn("Delete",async()=>{if(confirm("Delete this post?")){await sb.from("posts").delete().eq("id",p.id);loadFeed()}});
  else btn("Report",async()=>{await sb.from("reports").insert({post_id:p.id});alert("Thanks, we will review this post.")});
  box.append(d)})}

/* meals */
const F=[["Dal","g","Good protein and fibre, slow on blood sugar."],["Oats","g","Fibre helps keep insulin steady."],["Brown rice","g","Gentler on blood sugar than white rice."],["Paneer","g","Protein-rich, filling."],["Eggs","g","High protein, low carbohydrate."],["Sprouts","g","Fibre and protein."],["Almonds","g","Healthy fats; keep to a handful."],["Leafy greens","g","Iron, fibre and magnesium."],["Curd","g","Probiotic and protein; choose unsweetened."],["Roti","y","Fine in moderation; pair with dal or vegetables."],["White rice","y","Large portions spike blood sugar; pair with protein."],["Banana","y","Best with nuts or curd to slow the sugar."],["Mango","y","Natural sugar is high; keep portions small."],["Idli","y","Pair with sambar for protein."],["Cake","r","Refined sugar and flour spike insulin."],["Soft drinks","r","Liquid sugar raises insulin quickly."],["Samosa","r","Refined flour and deep-fried."],["Gulab jamun","r","Sugar syrup and refined flour."],["Instant noodles","r","Refined carbohydrate, little protein."]];
const W={g:"Good choice",y:"Okay in moderation",r:"Best limited"};
$("#q").oninput=e=>{const q=e.target.value.trim().toLowerCase(),box=$("#mres");box.innerHTML="";if(!q)return;
 const m=F.filter(f=>f[0].toLowerCase().includes(q));if(!m.length){box.innerHTML='<p class="muted">No match yet. Try another food.</p>';return}
 m.forEach(([n,c,why])=>{const d=document.createElement("div");d.className="v "+c;d.innerHTML="<h3></h3><p></p>";d.firstChild.textContent=n+": "+W[c];d.lastChild.textContent=why;box.append(d)})};
