/* Interview prep tracker: app logic. Plan data comes from plan.js, loaded first. */
(function(){
'use strict';

/* ---------- dates ---------- */
function pad(n){return String(n).padStart(2,'0');}
function dkey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function dayIndex(d){return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-START)/MS);}
function fmt(d){return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});}
function fmtShort(d){return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}
function now(){return new Date();}
function curIdx(){return Math.max(0,Math.min(DAYS-1,dayIndex(now())));}
function curWeek(){return Math.floor(curIdx()/7)+1;}
function weekStart(w){return addDays(START,(w-1)*7);}

/* ---------- state ---------- */
var LS='prep-tracker-v1';
var state={checks:{done:{},revise:{},notes:{},links:{}},log:{days:{},total:474,badges:{}},apps:{list:[]},custom:{items:[]},tests:{weeks:{}}};
var DOCS=['checks','log','apps','custom','tests'];
function clone(x){return JSON.parse(JSON.stringify(x));}
function norm(name,d){
  d=d&&typeof d==='object'?d:{};
  if(name==='checks')return {done:d.done||{},revise:d.revise||{},notes:d.notes||{},links:d.links||{}};
  if(name==='log')return {days:d.days||{},total:Number(d.total)>0?Number(d.total):474,badges:d.badges||{}};
  if(name==='apps')return {list:Array.isArray(d.list)?d.list:[]};
  if(name==='tests')return {weeks:d.weeks||{}};
  return {items:Array.isArray(d.items)?d.items:[]};
}
function hasContent(name){
  var s=state[name];
  if(name==='checks')return Object.keys(s.done).length+Object.keys(s.revise).length+Object.keys(s.notes).length+Object.keys(s.links).length>0;
  if(name==='log')return Object.keys(s.days).length>0||s.total!==474;
  if(name==='apps')return s.list.length>0;
  if(name==='tests')return Object.keys(s.weeks).length>0;
  return s.items.length>0;
}
function loadLocal(){try{var r=localStorage.getItem(LS);if(r){var o=JSON.parse(r);DOCS.forEach(function(n){state[n]=norm(n,o[n]);});}}catch(e){}}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}

var store=null,loaded=false,touched={},dirty={},busy={},timers={},failed=false;
function setSync(text,warn,isBusy){
  document.querySelectorAll('[data-sync]').forEach(function(el){el.textContent=text;el.className='status'+(warn?' warn':'')+(isBusy?' busy':'');});
}
function refreshSync(){
  if(!store)return;
  if(failed)return setSync('Not saved to your account. Kept on this device.',true);
  var pending=DOCS.some(function(n){return dirty[n]||busy[n];});
  setSync(pending?'Saving':'Saved to your account',false,pending);
}
function save(name){
  ui.acted=true;
  saveLocal();
  if(!loaded)touched[name]=true;
  if(!store)return;
  dirty[name]=true;refreshSync();
  clearTimeout(timers[name]);
  timers[name]=setTimeout(function(){flush(name,false);},700);
}
function flush(name,retried){
  if(!store||busy[name]||!dirty[name])return;
  busy[name]=true;dirty[name]=false;
  store.doc(name).set(clone(state[name])).then(function(){
    busy[name]=false;failed=false;
    if(dirty[name])flush(name,false);else refreshSync();
  },function(e){
    busy[name]=false;
    if(e&&e.code==='unavailable'&&!retried){dirty[name]=true;setTimeout(function(){flush(name,true);},800+Math.random()*1200);}
    else{failed=true;refreshSync();}
  });
}
function connect(){
  if(!window.claude||typeof window.claude.use!=='function'){loaded=true;setSync('Saved on this device');render();return;}
  var slow=setTimeout(function(){if(!loaded)setSync('Still connecting. Changes are kept on this device.',true);},10000);
  Promise.all([window.claude.use('db'),window.claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];
    if(!db||!user)throw 0;
    return user.id().then(function(uid){
      if(!uid)throw 0;
      var col=db.collection('data/users/'+uid);
      return Promise.all(DOCS.map(function(n){return col.doc(n).get();})).then(function(snaps){
        store=col;
        snaps.forEach(function(s,i){
          var n=DOCS[i];
          if(touched[n]){dirty[n]=true;}
          else if(s.exists){state[n]=norm(n,clone(s.data()));}
          else if(hasContent(n)){dirty[n]=true;}
        });
        loaded=true;clearTimeout(slow);saveLocal();render();
        DOCS.forEach(function(n){if(dirty[n])flush(n,false);});
        refreshSync();
      });
    });
  }).catch(function(){loaded=true;clearTimeout(slow);if(!store){setSync('Saved on this device');render();}});
}

/* ---------- helpers ---------- */
var NS='http://www.w3.org/2000/svg';
function h(tag,props){
  var e=document.createElement(tag),k,v,i,c;
  if(props)for(k in props){v=props[k];if(v==null||v===false)continue;
    if(k==='class')e.className=v;
    else if(k==='text')e.textContent=v;
    else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);
    else if(k==='checked'||k==='value'||k==='disabled'||k==='open'||k==='selected')e[k]=v;
    else e.setAttribute(k,v===true?'':v);}
  for(i=2;i<arguments.length;i++){c=arguments[i];if(Array.isArray(c)){c.forEach(function(x){app(e,x);});}else app(e,c);}
  return e;
}
function app(e,c){if(c==null||c===false)return;e.appendChild(c.nodeType?c:document.createTextNode(String(c)));}
var ICONS={
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
  code:'<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  server:'<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
  cube:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  chat:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  sparkles:'<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/>',
  clipboard:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  zap:'<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  right:'<path d="m9 18 6-6-6-6"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  minus:'<path d="M5 12h14"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  ext:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  play:'<path d="M6 4v16l14-8z"/>',
  square:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  timer:'<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  bookmark:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  grip:'<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  command:'<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  sparkle:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'
};
function icon(n,cls){var s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','ic'+(cls?' '+cls:''));s.setAttribute('aria-hidden','true');s.innerHTML=ICONS[n]||'';return s;}
var META={today:{icon:'calendar'},dsa:{icon:'code',col:'var(--c-dsa)'},'system-design':{icon:'server',col:'var(--c-sd)'},lld:{icon:'cube',col:'var(--c-lld)'},behavioural:{icon:'chat',col:'var(--c-beh)'},applications:{icon:'briefcase',col:'var(--c-apps)'},ai:{icon:'sparkles',col:'var(--c-ai)'},'weekly-test':{icon:'clipboard',col:'var(--c-test)'}};
function tcol(id){return (META[id]&&META[id].col)||'var(--primary)';}
function allItems(track){
  var out=[];track.groups.forEach(function(g){g.items.forEach(function(it){out.push(it);});});
  state.custom.items.forEach(function(it){if(it.track===track.id)out.push({id:it.id,t:it.title,w:0,custom:true});});
  return out;
}
function counts(track){var a=allItems(track),d=0;a.forEach(function(it){if(state.checks.done[it.id])d++;});return {done:d,total:a.length};}
function solved(){var s=0,k;for(k in state.log.days)s+=Number(state.log.days[k].dsa)||0;return s;}
function activity(){
  var m={},k,id;
  for(k in state.log.days){m[k]=(Number(state.log.days[k].dsa)||0)+((Number(state.log.days[k].hours)||0)>0?1:0);}
  for(id in state.checks.done){k=state.checks.done[id];m[k]=(m[k]||0)+1;}
  return m;
}
function streak(act){
  var d=now(),n=0;
  if(!act[dkey(d)])d=addDays(d,-1);
  while(act[dkey(d)]){n++;d=addDays(d,-1);}
  return n;
}
function appsThisWeek(cw){return state.apps.list.filter(function(a){var n=dayIndex(new Date(a.date+'T00:00:00'));return n>=(cw-1)*7&&n<cw*7;}).length;}
function tickedOn(k){var n=0,id;for(id in state.checks.done)if(state.checks.done[id]===k)n++;return n;}
function setDone(id,on,el){
  var r=el&&el.getBoundingClientRect?el.getBoundingClientRect():null;
  if(on){state.checks.done[id]=dkey(now());ui.pop=id;}else delete state.checks.done[id];
  save('checks');render();
  if(!on)return;
  var x=r?r.left+r.width/2:window.innerWidth/2,y=r?r.top+r.height/2:window.innerHeight/2,grp=null;
  TRACKS.forEach(function(t){t.groups.forEach(function(g){if(g.items.some(function(it){return it.id===id;}))grp=g;});});
  if(grp&&grp.items.every(function(it){return state.checks.done[it.id];})){confetti(x,y,60);toast('Section complete: '+grp.name,'trophy');}
  else confetti(x,y,14);
}
function logDay(sk,field,v,quiet){
  var o=state.log.days[sk]||{},was=Number(o[field])||0,goal=field==='dsa'?DAY_DSA:HOURS_DAY;
  v=Math.max(0,v);
  o[field]=v;if(!(Number(o.dsa)>0)&&!(Number(o.hours)>0))delete state.log.days[sk];else state.log.days[sk]=o;
  save('log');render();
  if(!quiet&&was<goal&&v>=goal){toast(field==='dsa'?'Daily DSA goal hit: '+goal+' problems':'Full '+goal+'-hour day logged','zap');confetti(window.innerWidth/2,window.innerHeight/3,50);}
}

/* ---------- theme ---------- */
var THEME_KEY='prep-theme';
function getTheme(){try{var t=localStorage.getItem(THEME_KEY);return t==='light'||t==='dark'?t:'system';}catch(e){return 'system';}}
function applyTheme(t){
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');
  try{if(t==='system')localStorage.removeItem(THEME_KEY);else localStorage.setItem(THEME_KEY,t);}catch(e){}
  updateThemeBtns();
}
function cycleTheme(){var t=getTheme(),n=t==='system'?'dark':t==='dark'?'light':'system';applyTheme(n);toast('Theme: '+(n==='system'?'follows your system':n),n==='dark'?'moon':n==='light'?'sun':'monitor');}
function updateThemeBtns(){var t=getTheme();document.querySelectorAll('[data-theme-btn]').forEach(function(b){b.textContent='';b.appendChild(icon(t==='dark'?'moon':t==='light'?'sun':'monitor'));b.setAttribute('aria-label','Theme is '+(t==='system'?'following your system':t)+'. Switch theme');});}

/* ---------- rewards and motion ---------- */
var REDUCED=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var DAY_DSA=5,DAY_ITEMS=3,XP_PER=750,ringPrev={},barPrev={},numPrev={};
var LEVELS=['Warming up','Finding rhythm','Consistent','Sharp','Dangerous','Interview ready','Closing offers','Unstoppable'];
var toastBox=document.getElementById('toasts');
function toast(text,ic){
  var t=h('div',{class:'toast'},icon(ic||'check'),h('span',{text:text}));toastBox.appendChild(t);
  setTimeout(function(){t.className='toast out';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},350);},3400);
}
function confetti(x,y,n){
  if(REDUCED||!document.body.animate)return;
  var cols=['var(--primary)','var(--good)','var(--warn-fill)','var(--heat2)','var(--c-ai)'];
  for(var i=0;i<n;i++){(function(i){
    var p=h('div',{class:'confetti'});p.style.left=x+'px';p.style.top=y+'px';p.style.background=cols[i%cols.length];
    document.body.appendChild(p);
    var a=Math.random()*Math.PI*2,d=40+Math.random()*(n>30?170:80),dx=Math.cos(a)*d,dy=Math.sin(a)*d-50;
    var an=p.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:'translate('+dx+'px,'+(dy+130)+'px) rotate('+(Math.random()*720-360)+'deg)',opacity:0}],{duration:700+Math.random()*600,easing:'cubic-bezier(.2,.7,.3,1)'});
    an.onfinish=function(){if(p.parentNode)p.parentNode.removeChild(p);};
  })(i);}
}
function xp(){var x=solved()*5+Object.keys(state.checks.done).length*10+state.apps.list.length*8+testsDone()*40,k;for(k in state.log.days)x+=Math.round((Number(state.log.days[k].hours)||0)*2);return x;}
function level(){var x=xp(),n=Math.floor(x/XP_PER);return {n:n+1,name:LEVELS[Math.min(n,LEVELS.length-1)],into:x%XP_PER,xp:x};}
function badges(){
  var act=activity(),st=streak(act),sv=solved(),dn=Object.keys(state.checks.done),apps=state.apps.list,k,six=false;
  for(k in state.log.days)if((Number(state.log.days[k].hours)||0)>=HOURS_DAY)six=true;
  function has(list){return dn.some(function(id){return list.indexOf(id)>=0;});}
  var MOCKS=['s30','s31','s32','s33','s34','b31','b32','dr_3'],ROUNDS=['m01','m02','m03','m04','m05','m06','m07','m08','m09','m10','m11','m12','m13','m14'];
  var intv=apps.filter(function(a){return a.status==='Interviewing'||a.status==='Offer';}).length,off=apps.filter(function(a){return a.status==='Offer';}).length;
  return [
    ['first','🌱','First tick','Complete any item',dn.length>=1,[Math.min(1,dn.length),1]],
    ['streak3','🔥','3-day streak','Log three days in a row',st>=3,[st,3]],
    ['streak7','⚡','7-day streak','Log seven days in a row',st>=7,[st,7]],
    ['streak30','🏔️','30-day streak','Log thirty days in a row',st>=30,[st,30]],
    ['six','⏱️','Full day','Log six hours in one day',six,null],
    ['p50','🧩','50 problems','Solve 50 DSA problems',sv>=50,[sv,50]],
    ['p150','🧠','150 problems','Solve 150 DSA problems',sv>=150,[sv,150]],
    ['p300','🚀','300 problems','Solve 300 DSA problems',sv>=300,[sv,300]],
    ['pall','🏆','Sheet complete','Solve every problem in the sheet',sv>=state.log.total,[sv,state.log.total]],
    ['round','⌨️','First timed round','Finish a machine coding round',has(ROUNDS),null],
    ['mock','🎤','First mock','Finish any mock interview',has(MOCKS),null],
    ['test1','📝','First weekly test','Score every part of a weekly test',testsDone()>=1,null],
    ['app1','📨','First application','Add an application',apps.length>=1,[Math.min(1,apps.length),1]],
    ['app10','📬','10 applications','Add ten applications',apps.length>=10,[apps.length,10]],
    ['intv','🤝','Interview stage','Move an application to Interviewing',intv>0,null],
    ['offer','🎉','Offer','Mark an application as an offer',off>0,null]
  ];
}
function awardBadges(){
  if(!loaded)return;
  var fresh=[],quiet=!ui.acted,lv=level();
  badges().forEach(function(b){if(b[4]&&!state.log.badges[b[0]]){state.log.badges[b[0]]=dkey(now());fresh.push(b);}});
  if(fresh.length){
    save('log');
    if(!quiet){fresh.forEach(function(b){toast('Badge earned: '+b[2]+' '+b[1],'trophy');});confetti(window.innerWidth/2,window.innerHeight/2,70);}
  }
  if(!quiet&&ui.lastLevel&&lv.n>ui.lastLevel)toast('Level '+lv.n+': '+lv.name,'zap');
  ui.lastLevel=lv.n;
}
function raf2(fn){requestAnimationFrame(function(){requestAnimationFrame(fn);});}
function ring(key,val,target,o){
  o=o||{};
  var R=42,C=2*Math.PI*R,p=Math.min(1,target?val/target:0),prev=ringPrev[key]||0;ringPrev[key]=p;
  var svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
  function circ(cls){var c=document.createElementNS(NS,'circle');c.setAttribute('cx','50');c.setAttribute('cy','50');c.setAttribute('r',String(R));c.setAttribute('class',cls);return c;}
  var pr=circ('pr');pr.style.strokeDasharray=String(C);pr.style.strokeDashoffset=String(C*(1-prev));
  svg.appendChild(circ('tr'));svg.appendChild(pr);
  raf2(function(){pr.style.strokeDashoffset=String(C*(1-p));});
  return h('div',{class:'ring'+(p>=1&&!o.noFull?' full':''),role:'img','aria-label':(o.label||'Progress')+': '+val+' of '+target,style:o.col?'--col:'+o.col:null},svg,
    h('div',{class:'num'},o.main!=null?o.main:String(val),h('small',{text:o.small!=null?o.small:'of '+target})));
}
function cnt(key,val,dec){var el=h('span',{class:'num','data-count':String(val),'data-key':key,'data-dec':String(dec||0),text:fmtNum(val,dec||0)});return el;}
function fmtNum(v,dec){return dec?(Math.round(v*Math.pow(10,dec))/Math.pow(10,dec)).toFixed(dec).replace(/\.0+$/,''):String(Math.round(v));}
function animateCounts(root){
  root.querySelectorAll('[data-count]').forEach(function(el){
    var key=el.getAttribute('data-key'),to=Number(el.getAttribute('data-count')),dec=Number(el.getAttribute('data-dec')),from=key in numPrev?numPrev[key]:0;
    numPrev[key]=to;
    if(REDUCED||from===to){el.textContent=fmtNum(to,dec);return;}
    var t0=performance.now(),dur=650;
    (function step(t){var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=fmtNum(from+(to-from)*e,dec);if(k<1)requestAnimationFrame(step);})(t0);
  });
}

/* ---------- tooltip ---------- */
var tip=document.getElementById('tip');
function showTip(el,lines){
  tip.textContent='';
  app(tip,lines[0]);if(lines[1])app(tip,h('small',{text:lines[1]}));
  var r=el.getBoundingClientRect();tip.style.left=(r.left+r.width/2)+'px';tip.style.top=r.top+'px';
  tip.classList.add('on');
  var w=tip.offsetWidth,cx=r.left+r.width/2,min=w/2+8,max=window.innerWidth-w/2-8;
  tip.style.left=Math.max(min,Math.min(max,cx))+'px';
}
function hideTip(){tip.classList.remove('on');}
function tipOn(el,lines){el.addEventListener('mouseenter',function(){showTip(el,lines);});el.addEventListener('mouseleave',hideTip);el.addEventListener('focus',function(){showTip(el,lines);});el.addEventListener('blur',hideTip);}

/* ---------- timer: weekly tests and focus sessions ---------- */
var ft=document.getElementById('ftimer'),ftRefs=null,tick=null;
function clockText(ms){var s=Math.max(0,Math.round(ms/1000));return Math.floor(s/60)+':'+pad(s%60);}
function startTimer(key,mins,label,o){
  o=o||{};
  ui.timer={key:key,end:Date.now()+mins*60000,total:mins*60000,label:label,focus:!!o.focus,hours:o.hours||0};
  if(!tick)tick=setInterval(tickTimer,1000);
  ftRefs=null;renderTimer();render();
}
function stopTimer(){ui.timer=null;clearInterval(tick);tick=null;renderTimer();render();}
function startFocus(mins){startTimer('focus',mins,'Focus session, '+mins+' minutes',{focus:true,hours:mins/60});toast('Focus session started. Phone away.','timer');}
function tickTimer(){
  if(!ui.timer)return stopTimer();
  var left=ui.timer.end-Date.now();renderTimer();
  if(left<=0){
    var t=ui.timer;ui.timer=null;clearInterval(tick);tick=null;renderTimer();
    if(t.focus){var k=dkey(now()),d=state.log.days[k]||{},add=Math.round(t.hours*2)/2;logDay(k,'hours',(Number(d.hours)||0)+add,true);toast('Focus session done. Logged '+add+' h for today.','zap');confetti(window.innerWidth/2,window.innerHeight/3,40);}
    else toast('Time is up: '+t.label,'timer');
    render();
  }
}
function renderTimer(){
  if(!ui.timer){ft.classList.remove('on');ft.textContent='';ftRefs=null;return;}
  var t=ui.timer,left=Math.max(0,t.end-Date.now()),p=Math.min(1,1-left/t.total);
  if(!ftRefs){
    ft.textContent='';
    var R=42,C=2*Math.PI*R,svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
    var tr=document.createElementNS(NS,'circle'),pr=document.createElementNS(NS,'circle');
    [tr,pr].forEach(function(c){c.setAttribute('cx','50');c.setAttribute('cy','50');c.setAttribute('r',String(R));});
    tr.setAttribute('class','tr');pr.setAttribute('class','pr');pr.style.strokeDasharray=String(C);pr.style.strokeDashoffset=String(C*(1-p));
    svg.appendChild(tr);svg.appendChild(pr);
    var b=h('b',{class:'num'}),s=h('span',{text:t.label});
    ft.appendChild(h('div',{class:'ring'},svg));ft.appendChild(h('div',{class:'txt'},b,s));
    ft.appendChild(h('button',{type:'button',class:'ibtn','aria-label':'Stop timer',onclick:stopTimer},icon('x')));
    ftRefs={pr:pr,b:b,C:C};ft.classList.add('on');
  }
  ftRefs.pr.style.strokeDashoffset=String(ftRefs.C*(1-p));ftRefs.b.textContent=clockText(left);
}

/* ---------- views ---------- */
var view=document.getElementById('view'),tabsEl=document.getElementById('tabs'),navEl=document.getElementById('nav'),dayprogEl=document.getElementById('dayprog');
var ui={pop:null,acted:false,lastRoute:null,lastLevel:0,calShown:false,filter:{},q:{},open:{},selDay:null,showLate:false,noteOpen:{},linkOpen:{},linkErr:null,confirm:null,appErr:'',appView:null,timer:null,overlay:null,pal:null,hl:null,refocus:null,scrolled:false};
function route(){var r=location.hash.replace('#','').split('?')[0];return TABS.some(function(t){return t[0]===r;})?r:'today';}
function navCount(id){
  var t=TRACKS.filter(function(x){return x.id===id;})[0];
  if(t){var c=counts(t);return c.done+'/'+c.total;}
  if(id==='applications')return state.apps.list.length?String(state.apps.list.length):'';
  if(id==='weekly-test'){var n=testsDone();return n?n+'/'+WEEKS:'';}
  return '';
}
function navLink(t,r,mobile){
  var m=META[t[0]]||{},a=h('a',{href:'#'+t[0],'aria-current':t[0]===r?'page':null,style:m.col?'--track:'+m.col:null},icon(m.icon||'calendar'),h('span',{text:t[1]}));
  if(!mobile){var c=navCount(t[0]);if(c)a.appendChild(h('span',{class:'ct',text:c}));}
  return a;
}
function renderNav(r){
  navEl.textContent='';tabsEl.textContent='';
  TABS.forEach(function(t){navEl.appendChild(navLink(t,r,false));tabsEl.appendChild(navLink(t,r,true));});
  var act=tabsEl.querySelector('[aria-current="page"]');
  if(act&&r!==ui.lastRoute)tabsEl.scrollLeft=act.offsetLeft-tabsEl.clientWidth/2+act.offsetWidth/2;
  var ci=curIdx(),idx=dayIndex(now());
  dayprogEl.textContent='';
  dayprogEl.appendChild(h('b',{text:idx<0?'Starts '+fmtShort(START):idx>=DAYS?'Plan complete':'Day '+(ci+1)+' of '+DAYS}));
  dayprogEl.appendChild(h('div',{class:'mini',style:'max-width:none'},h('i',{style:'width:'+((idx<0?0:ci+1)/DAYS*100)+'%'})));
  dayprogEl.appendChild(h('div',{style:'margin-top:.4rem',text:idx<0?'Fourteen weeks, to 12 March':idx>=DAYS?'Ended 12 March':(DAYS-1-ci)+' days to go, week '+curWeek()+' of '+WEEKS}));
}
function render(){
  var r=route(),y=window.scrollY,nodes;
  awardBadges();
  renderNav(r);
  if(r==='today')nodes=viewToday();
  else if(r==='applications')nodes=viewApps();
  else if(r==='weekly-test')nodes=viewTests();
  else nodes=viewTrack(TRACKS.filter(function(t){return t.id===r;})[0]);
  view.textContent='';nodes.forEach(function(n,i){if(n&&n.style)n.style.setProperty('--i',i);app(view,n);});
  Array.prototype.forEach.call(view.querySelectorAll('.bar i,.track i,.mini i,.chart .col i'),function(el,i){
    var k=r+':'+i,target=el.style.width||el.style.height,prop=el.style.width?'width':'height',prev=barPrev[k]||'0%';barPrev[k]=target;
    if(prev===target||REDUCED)return;
    el.style.transition='none';el.style[prop]=prev;
    raf2(function(){el.style.transition='';el.style[prop]=target;});
  });
  view.classList.toggle('stagger',r!==ui.lastRoute);
  ui.lastRoute=r;ui.pop=null;if(r==='today')ui.calShown=true;
  animateCounts(view);
  ui.scrolled=false;
  if(ui.hl){var el=view.querySelector('[data-id="'+ui.hl+'"]');ui.hl=null;if(el){el.classList.add('hl');el.scrollIntoView({block:'center'});ui.scrolled=true;return;}}
  if(ui.refocus){var f=document.getElementById(ui.refocus);ui.refocus=null;if(f){f.focus();try{var L=f.value.length;f.setSelectionRange(L,L);}catch(e){}}}
  window.scrollTo(0,y);
}
function stepper(label,value,step,onChange){
  function set(v){v=Math.max(0,Math.round(v/step)*step);onChange(v);}
  return h('div',{class:'stepper'},
    h('button',{type:'button','aria-label':'Decrease '+label,onclick:function(){set(value-step);}},icon('minus')),
    h('input',{type:'number',min:'0',step:String(step),inputmode:'decimal','aria-label':label,value:String(value),onchange:function(e){set(Number(e.target.value)||0);}}),
    h('button',{type:'button','aria-label':'Increase '+label,onclick:function(){set(value+step);}},icon('plus')));
}
function seg(opts,val,onPick,label){
  var s=h('div',{class:'seg',role:'group','aria-label':label||'Options'});
  opts.forEach(function(o){s.appendChild(h('button',{type:'button','aria-pressed':val===o[0]?'true':'false',text:o[1],onclick:function(){onPick(o[0]);}}));});
  return s;
}
function kpi(key,val,label,tone,dec){return h('div',{class:'kpi'+(tone?' '+tone:'')},h('strong',null,typeof val==='number'?cnt(key,val,dec):h('span',{class:'sm',text:String(val)})),h('span',{text:label}));}
function emptyState(ic,title,text,action){return h('div',{class:'empty'},icon(ic),h('b',{text:title}),h('p',{text:text}),action||null);}
function groupDetails(key,name,done,total,children,o){
  o=o||{};
  var det=h('details',{class:'grp'+(total&&done===total?' complete':''),open:!!o.open},
    h('summary',null,o.lead||null,h('span',{class:'gname',text:name}),
      total?h('span',{class:'mini',style:o.col?'--col:'+o.col:null},h('i',{style:'width:'+(done/total*100)+'%'})):null,
      h('span',{class:'gct',text:total?done+' of '+total:(o.emptyLabel||'Nothing here')}),icon('check','done-ic'),icon('chevron','chev')));
  det.addEventListener('toggle',function(){ui.open[key]=det.open;});
  var body=h('div',{class:'body'});children.forEach(function(c){body.appendChild(c);});det.appendChild(body);
  return det;
}
function itemRow(it,track,cw,showTrack,sfx){
  var done=!!state.checks.done[it.id],rev=!!state.checks.revise[it.id],note=state.checks.notes[it.id]||'',cid='c_'+it.id+(sfx||''),today=dayIndex(now());
  var meta=h('div',{class:'meta'});
  if(showTrack)meta.appendChild(h('span',{class:'pill tr',style:'--col:'+tcol(track.id)},h('i',{class:'dot',style:'--col:'+tcol(track.id)+';width:.5rem;height:.5rem'}),track.name));
  if(it.w){
    if(!done&&it.d<today)meta.appendChild(h('span',{class:'pill late'},icon('flame'),'Was due '+fmt(addDays(START,it.d))));
    else meta.appendChild(h('span',{class:'pill'},icon('calendar'),(it.d0<it.d?fmtShort(addDays(START,it.d0))+' to '+fmtShort(addDays(START,it.d)):fmt(addDays(START,it.d)))+', week '+it.w));
  }
  function ext(label,url){return h('a',{class:'ilink',href:url,target:'_blank',rel:'noopener noreferrer'},label,icon('ext'));}
  var saved=state.checks.links[it.id]||'';
  if(LINKS[it.id])meta.appendChild(ext(LINKS[it.id][0],LINKS[it.id][1]));
  if(it.q){meta.appendChild(ext('Videos','https://www.youtube.com/results?search_query='+encodeURIComponent(it.q)));meta.appendChild(ext('Articles','https://www.google.com/search?q='+encodeURIComponent(it.q)));}
  if(saved.indexOf('https://')===0)meta.appendChild(ext('Your link',saved));
  meta.appendChild(h('button',{type:'button',class:'iact','aria-pressed':rev?'true':'false',onclick:function(){
    if(rev)delete state.checks.revise[it.id];else state.checks.revise[it.id]=true;save('checks');render();}},icon('bookmark'),rev?'To revise':'Revise'));
  meta.appendChild(h('button',{type:'button',class:'iact',onclick:function(){ui.noteOpen[it.id]=!ui.noteOpen[it.id];render();}},icon('pencil'),note?'Note':'Add note'));
  meta.appendChild(h('button',{type:'button',class:'iact',onclick:function(){ui.linkOpen[it.id]=!ui.linkOpen[it.id];render();}},icon('link'),saved?'Change link':'Save link'));
  if(it.custom)meta.appendChild(h('button',{type:'button',class:'iact danger',onclick:function(){
    state.custom.items=state.custom.items.filter(function(x){return x.id!==it.id;});
    delete state.checks.done[it.id];delete state.checks.revise[it.id];delete state.checks.notes[it.id];delete state.checks.links[it.id];
    save('custom');save('checks');render();}},icon('trash'),'Remove'));
  var row=h('div',{class:'item'+(done?' done':'')+(ui.pop===it.id?' pop':''),'data-id':it.id},
    h('span',{class:'cb'},h('input',{type:'checkbox',id:cid,checked:done,onchange:function(e){setDone(it.id,e.target.checked,e.target);}}),h('span',null,icon('check'))),
    h('label',{for:cid,text:route()==='today'&&it.full?it.full:it.t}),meta);
  if(ui.noteOpen[it.id]||note)row.appendChild(h('input',{class:'note',type:'text','aria-label':'Note for '+it.t,placeholder:'What went wrong, or what to remember',value:note,onchange:function(e){
    var v=e.target.value.trim();if(v)state.checks.notes[it.id]=v;else delete state.checks.notes[it.id];save('checks');}}));
  if(ui.linkOpen[it.id]){
    row.appendChild(h('input',{class:'note',type:'url','aria-label':'Link for '+it.t,placeholder:'Paste the video, article or notes link you want to keep',value:saved,onchange:function(e){
      var v=e.target.value.trim();
      if(!v){delete state.checks.links[it.id];ui.linkErr=null;ui.linkOpen[it.id]=false;}
      else if(v.indexOf('https://')===0&&v.indexOf(' ')<0){state.checks.links[it.id]=v;ui.linkErr=null;ui.linkOpen[it.id]=false;}
      else{ui.linkErr=it.id;render();return;}
      save('checks');render();}}));
    if(ui.linkErr===it.id)row.appendChild(h('p',{class:'err',style:'margin:.25rem 0 0',role:'alert',text:'Paste a full link that starts with https://'}));
  }
  return row;
}

function viewToday(){
  var out=[],idx=dayIndex(now()),ci=curIdx(),cw=curWeek(),act=activity(),st=streak(act),lv=level(),todayK=dkey(now());
  if(ui.selDay==null)ui.selDay=ci;
  var left=DAYS-1-ci;
  var headline=idx<0?'Starts '+fmtShort(START):idx>=DAYS?'Fourteen weeks done':'Week '+cw+' of '+WEEKS;
  var sub=idx<0?'Your plan runs for fourteen weeks, from 5 December to 12 March. Everything you tick before then still counts.':idx>=DAYS?'The plan ended on 12 March. Everything you logged is still here.':fmt(now())+'. '+left+(left===1?' day':' days')+' to go.';
  var openToday=0;TRACKS.forEach(function(t){allItems(t).forEach(function(it){if(it.w&&it.d0<=ci&&ci<=it.d&&!state.checks.done[it.id])openToday++;});});
  var bento=h('div',{class:'bento'});
  function withIndex(el,i){el.style.setProperty('--i',i);bento.appendChild(el);}

  withIndex(h('section',{class:'card hero b-4'},
    h('div',null,h('div',{class:'eyebrow',text:idx<0?'Interview prep':'Day '+(ci+1)+' of '+DAYS}),h('h1',{text:headline}),h('p',{text:sub})),
    h('div',{class:'row'},
      h('span',{class:'chip'},icon('flame'),st>0?st+'-day streak':'No streak yet'),
      h('span',{class:'chip'},icon('zap'),'Level '+lv.n+', '+lv.name),
      h('span',{class:'chip'},icon('target'),openToday+(openToday===1?' item':' items')+(idx<0?' on the first day':' open today'))),
    h('div',{class:'row'},
      h('a',{class:'btn light',href:'#log',onclick:function(e){e.preventDefault();var el=document.getElementById('log');if(el)el.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});}},icon('check'),'Log today'),
      h('button',{type:'button',class:'btn light',onclick:function(){startFocus(25);}},icon('timer'),'Focus for 25 minutes')),
    h('div',null,h('div',{class:'track'},h('i',{style:'width:'+((idx<0?0:ci+1)/DAYS*100)+'%'})),h('div',{class:'trackl'},h('span',{text:'5 Dec'}),h('span',{text:Math.round((idx<0?0:ci+1)/DAYS*100)+'% of the plan'}),h('span',{text:'12 Mar'})))),0);

  withIndex(h('section',{class:'card lift level b-2'},
    ring('level',lv.into,XP_PER,{label:'Progress to the next level',main:'Lv '+lv.n,small:lv.into+' / '+XP_PER+' XP',noFull:true}),
    h('strong',{text:lv.name}),
    h('p',{class:'hint',text:(XP_PER-lv.into)+' XP to level '+(lv.n+1)+'. '+lv.xp+' XP earned in total.'}),
    h('p',{class:'hint',text:'10 XP per item, 5 per DSA problem, 8 per application, 2 per hour and 40 per weekly test.'})),1);

  var heat=h('div',{class:'heat'+(ui.calShown?'':' intro')}),months=h('div',{class:'months','aria-hidden':'true'}),lastM=-1,active=0;
  for(var c=0;c<WEEKS;c++){var md=addDays(START,c*7);if(md.getMonth()!==lastM){lastM=md.getMonth();months.appendChild(h('span',{style:'grid-column:'+(c+1),text:md.toLocaleDateString('en-GB',{month:'short'})}));}}
  var days=h('div',{class:'days','aria-hidden':'true'});for(var r=0;r<7;r++)days.appendChild(h('span',{text:addDays(START,r).toLocaleDateString('en-GB',{weekday:'short'}).slice(0,3)}));
  var grid=h('div',{class:'grid',role:'group','aria-label':'Fourteen-week calendar, one square per day'});
  for(var i=0;i<DAYS;i++){(function(i){
    var d=addDays(START,i),k=dkey(d),a=act[k]||0,l=a===0?0:a<3?1:a<6?2:3,dl=state.log.days[k]||{},tk=tickedOn(k);
    if(a)active++;
    var desc=a?[(Number(dl.dsa)||0)+(Number(dl.dsa)===1?' problem':' problems'),(Number(dl.hours)||0)+' h',tk+(tk===1?' item':' items')].join(' · '):i>idx?'Not yet':'Nothing logged';
    var b=h('button',{type:'button',class:'cell'+(i===ci&&idx>=0&&idx<DAYS?' today':'')+(i===ui.selDay?' sel':''),style:'--c:'+Math.floor(i/7),'data-l':String(l),'aria-label':fmt(d)+', '+desc,onclick:function(){ui.selDay=i;render();}});
    tipOn(b,[fmt(d),desc]);grid.appendChild(b);
  })(i);}
  heat.appendChild(h('div'));heat.appendChild(months);heat.appendChild(days);heat.appendChild(grid);
  withIndex(h('section',{class:'card b-3'},
    h('div',{class:'card-h'},h('h2',{text:'Fourteen weeks at a glance'}),h('span',{class:'aside',text:'Tap a day to see its plan'})),heat,
    h('div',{class:'heat-foot'},h('span',null,cnt('active',active),active===1?' active day so far':' active days so far'),h('span',{class:'legend'},'Less',h('i'),h('i',{'data-l':'1'}),h('i',{'data-l':'2'}),h('i',{'data-l':'3'}),'More'))),2);

  var sd=addDays(START,ui.selDay),sk=dkey(sd),day=state.log.days[sk]||{},ticked=tickedOn(sk);
  function stepCol(label,field,val,step,goal){return h('div',null,ring('r_'+field,val,goal,{label:label}),h('div',{class:'rlab',text:label}),stepper(label,val,step,function(v){logDay(sk,field,v);}));}
  withIndex(h('section',{class:'card b-3',id:'log'},
    h('div',{class:'card-h'},h('h2',{text:'Log for '+(sk===todayK?'today':fmtShort(sd))}),ui.selDay!==ci?h('button',{type:'button',class:'link',text:idx<0?'Back to the first day':'Back to today',onclick:function(){ui.selDay=ci;render();}}):h('span',{class:'aside',text:idx<0?'The first day':fmtShort(sd)})),
    h('div',{class:'rings'},stepCol('DSA problems','dsa',Number(day.dsa)||0,1,DAY_DSA),stepCol('Hours','hours',Number(day.hours)||0,0.5,HOURS_DAY),h('div',null,ring('r_items',ticked,DAY_ITEMS,{label:'Items ticked'}),h('div',{class:'rlab',text:'Items ticked'}))),
    h('div',{class:'focus-row'},h('button',{type:'button',class:'btn soft sm',onclick:function(){startFocus(25);}},icon('timer'),'Focus 25 min'),h('button',{type:'button',class:'btn soft sm',onclick:function(){startFocus(50);}},icon('timer'),'Focus 50 min'))),3);

  var total=state.log.total,sv=solved(),exp=Math.round(total*Math.min(1,(ci+1)/DSA_DAYS)),diff=sv-Math.round(total*Math.min(1,ci/DSA_DAYS));
  var paceEl=idx<0?h('span',{class:'aside',text:'Pace starts 5 Dec'}):h('span',{class:'pace '+(diff>=0?'ahead':'behind')},icon(diff>=0?'zap':'flame'),Math.abs(diff)<=2?'On pace':(diff>0?diff+' ahead of pace':Math.abs(diff)+' behind pace'));
  var prog=h('div',{class:'prog'});
  prog.appendChild(h('a',{href:'#dsa'},h('span',{class:'nm'},h('i',{class:'dot',style:'--col:'+tcol('dsa')}),'DSA problems'),h('span',{class:'ct',text:sv+' of '+total+', pace '+exp}),
    h('div',{class:'bar',style:'--col:'+tcol('dsa')},h('i',{style:'width:'+Math.min(100,sv/total*100)+'%'}),h('b',{style:'left:'+Math.min(100,exp/total*100)+'%'}))));
  TRACKS.forEach(function(t){var c=counts(t);
    prog.appendChild(h('a',{href:'#'+t.id},h('span',{class:'nm'},h('i',{class:'dot',style:'--col:'+tcol(t.id)}),t.id==='dsa'?'DSA sections':t.name),h('span',{class:'ct',text:c.done+' of '+c.total}),
      h('div',{class:'bar',style:'--col:'+tcol(t.id)},h('i',{style:'width:'+(c.total?c.done/c.total*100:0)+'%'}))));});
  var hw=0;for(var j=(cw-1)*7;j<cw*7;j++){var dd=state.log.days[dkey(addDays(START,j))];if(dd)hw+=Number(dd.hours)||0;}
  prog.appendChild(h('a',{href:'#log',onclick:function(e){e.preventDefault();var el=document.getElementById('log');if(el)el.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});}},h('span',{class:'nm'},h('i',{class:'dot',style:'--col:var(--warn-fill)'}),'Hours this week'),h('span',{class:'ct',text:hw+' of '+HOURS_DAY*7}),
    h('div',{class:'bar',style:'--col:var(--warn-fill)'},h('i',{style:'width:'+Math.min(100,hw/(HOURS_DAY*7)*100)+'%'}))));
  var wk=appsThisWeek(cw);
  prog.appendChild(h('a',{href:'#applications'},h('span',{class:'nm'},h('i',{class:'dot',style:'--col:'+tcol('applications')}),'Applications'),h('span',{class:'ct',text:state.apps.list.length+' sent, '+wk+' of '+APP_WEEKLY+' this week'}),
    h('div',{class:'bar',style:'--col:'+tcol('applications')},h('i',{style:'width:'+Math.min(100,wk/APP_WEEKLY*100)+'%'}))));
  withIndex(h('section',{class:'card b-3'},h('div',{class:'card-h'},h('h2',{text:'Progress'}),paceEl),prog),4);

  var N=14,from=Math.max(0,ci-N+1),cols=h('div',{class:'cols'}),sumH=0,sumP=0,maxH=HOURS_DAY,rows=[];
  for(var q=from;q<=ci;q++){var kq=dkey(addDays(START,q)),dq=state.log.days[kq]||{},hh=Number(dq.hours)||0,pp=Number(dq.dsa)||0;sumH+=hh;sumP+=pp;if(hh>maxH)maxH=hh;rows.push([q,hh,pp]);}
  var scale=maxH*1.15;
  cols.appendChild(h('div',{class:'goal',style:'bottom:'+(HOURS_DAY/scale*100)+'%'},h('span',{text:HOURS_DAY+' h goal'})));
  rows.forEach(function(x){var d=addDays(START,x[0]),col=h('div',{class:'col'+(x[1]?'':' zero')+(x[0]===ci?' today':''),tabindex:'0',role:'img','aria-label':fmt(d)+': '+x[1]+' hours, '+x[2]+' problems'},h('i',{style:'height:'+(x[1]?Math.max(4,x[1]/scale*100):0)+'%'}));
    tipOn(col,[fmt(d),x[1]+' h · '+x[2]+(x[2]===1?' problem':' problems')]);cols.appendChild(col);});
  var chart=h('div',{class:'chart'},cols,h('div',{class:'ax'},h('span',{text:fmtShort(addDays(START,from))}),h('span',{text:'Hours per day'}),h('span',{text:fmtShort(addDays(START,ci))})));
  withIndex(idx<0?h('section',{class:'card b-3'},h('div',{class:'card-h'},h('h2',{text:'Hours per day'})),emptyState('timer','Your first two weeks will show here','Log hours on any day and this chart fills in, with the '+HOURS_DAY+'-hour goal marked.'))
    :h('section',{class:'card b-3'},h('div',{class:'card-h'},h('h2',{text:'Last '+rows.length+(rows.length===1?' day':' days')}),h('span',{class:'aside'},cnt('sumH',sumH,1),' h · ',cnt('sumP',sumP),sumP===1?' problem':' problems')),chart),5);
  out.push(bento);

  out.push(h('div',{class:'sec'},h('h2',{text:'Plan for '+fmt(sd)}),h('div',{class:'dayswitch'},
    h('button',{type:'button',class:'ibtn','aria-label':'Previous day',disabled:ui.selDay<=0,onclick:function(){ui.selDay--;render();}},icon('left')),
    ui.selDay!==ci?h('button',{type:'button',class:'btn ghost sm',text:idx<0?'First day':'Today',onclick:function(){ui.selDay=ci;render();}}):null,
    h('button',{type:'button',class:'ibtn','aria-label':'Next day',disabled:ui.selDay>=DAYS-1,onclick:function(){ui.selDay++;render();}},icon('right')))));
  if(ui.selDay>=8&&(ui.selDay-1)%7===0){var tw=(ui.selDay-1)/7;out.push(h('div',{class:'card',style:'display:flex;gap:.75rem;align-items:center;flex-wrap:wrap'},h('span',{class:'tic',style:'--col:'+tcol('weekly-test')},icon('clipboard')),h('span',{style:'flex:1 1 14rem'},'Weekly test day: test yourself on everything from week '+tw+'.'),h('a',{class:'btn soft sm',href:'#weekly-test',text:'Open the week '+tw+' test'})));}
  var planCard=h('div',{class:'card'}),any=false,late=0;
  TRACKS.forEach(function(t){
    var list=allItems(t).filter(function(it){
      var dv=state.checks.done[it.id];if(!it.w||(dv&&dv!==sk))return false;if(dv)return true;
      if(it.d<ui.selDay){late++;return ui.showLate;}
      return it.d0<=ui.selDay&&ui.selDay<=it.d;});
    if(!list.length)return;any=true;
    planCard.appendChild(h('div',{class:'grpname'},h('i',{class:'dot',style:'--col:'+tcol(t.id)}),t.name));
    list.forEach(function(it){planCard.appendChild(itemRow(it,t,cw,false));});
  });
  if(!any)planCard.appendChild(emptyState(late?'check':'sparkle',late?'All done for this day':'Nothing planned',late?'Everything planned for this day is ticked. Earlier days still have open items.':'A free day. Use it to catch up, or rest.'));
  if(late)planCard.appendChild(h('p',{style:'margin:.75rem 0 0'},h('button',{type:'button',class:'link',text:ui.showLate?'Hide items from earlier days':'Show '+late+' open '+(late===1?'item':'items')+' from earlier days',onclick:function(){ui.showLate=!ui.showLate;render();}})));
  out.push(planCard);

  out.push(h('div',{class:'sec'},h('h2',{text:'A '+HOURS_DAY+'-hour day'}),h('span',{class:'aside',text:'How the hours split'})));
  var sp=h('div',{class:'card split'});
  SPLIT.forEach(function(s){sp.appendChild(h('a',{href:'#'+s[2]},h('i',{class:'dot',style:'--col:'+tcol(s[2])}),h('span',{class:'nm',text:s[0]}),h('span',{class:'ct',text:s[1]}),icon('right')));});
  out.push(sp);

  var selW=Math.floor(ui.selDay/7);
  out.push(h('div',{class:'sec'},h('h2',{text:'Week '+(selW+1)+', day by day'}),h('span',{class:'aside',text:fmtShort(addDays(START,selW*7))+' to '+fmtShort(addDays(START,selW*7+6))})));
  for(var wd=0;wd<7;wd++){(function(di){
    var rows=[],dn=0;
    TRACKS.forEach(function(t){allItems(t).forEach(function(it){if(it.w&&it.d===di){rows.push([it,t]);if(state.checks.done[it.id])dn++;}});});
    var key='day|'+di;
    out.push(groupDetails(key,fmt(addDays(START,di))+(di===idx?', today':''),dn,rows.length,rows.map(function(x){return itemRow(x[0],x[1],cw,true,'_w');}),{open:!!ui.open[key],emptyLabel:'Catch-up day'}));
  })(selW*7+wd);}

  var bl=badges(),earned=bl.filter(function(b){return b[4]||state.log.badges[b[0]];}).length;
  out.push(h('div',{class:'sec'},h('h2',{text:'Badges'}),h('span',{class:'aside',text:earned+' of '+bl.length+' earned'})));
  var bg=h('div',{class:'badges'});
  bl.forEach(function(b){var got=b[4]||state.log.badges[b[0]],pr=b[5],when=state.log.badges[b[0]];
    bg.appendChild(h('div',{class:'badge '+(got?'earned':'locked')},h('span',{class:'ic-e','aria-hidden':'true',text:b[1]}),
      h('span',{style:'min-width:0;flex:1'},h('b',{text:b[2]}),got?'Earned'+(when?' '+fmtShort(new Date(when+'T00:00:00')):''):b[3],
        !got&&pr?h('span',{class:'mini',style:'--col:var(--warn-fill)'},h('i',{style:'width:'+Math.min(100,pr[0]/pr[1]*100)+'%'})):null)));});
  out.push(bg);
  out.push(h('footer',{class:'foot'},h('span',{text:'Progress is saved on this device'+(store?' and to your account':'')+'. Back it up from Settings.'}),h('button',{type:'button',class:'link',text:'Open settings',onclick:openSettings})));
  return out;
}

function viewTrack(t){
  var out=[],cw=curWeek(),ci=curIdx(),c=counts(t),f=ui.filter[t.id]||'all',q=(ui.q[t.id]||'').trim().toLowerCase(),items=allItems(t);
  var dueWeek=0,over=0,rev=0;
  items.forEach(function(it){if(state.checks.done[it.id])return;if(it.w===cw)dueWeek++;if(it.w&&it.d<ci)over++;if(state.checks.revise[it.id])rev++;});
  out.push(h('div',{class:'page-head'},
    h('div',null,h('h1',{style:'display:flex;align-items:center;gap:.6rem'},h('span',{class:'tic',style:'--col:'+tcol(t.id)},icon(META[t.id].icon)),t.name),h('p',{class:'sub',text:t.intro})),
    TRACK_LINKS[t.id]?h('div',{class:'tools'},TRACK_LINKS[t.id].map(function(l){return h('a',{class:'btn ghost sm',href:l[1],target:'_blank',rel:'noopener noreferrer'},l[0],icon('ext'));})):null));
  var ov=h('div',{class:'card ov'},
    ring('trk_'+t.id,c.done,c.total,{label:'Done',col:tcol(t.id),main:Math.round(c.total?c.done/c.total*100:0)+'%',small:c.done+' of '+c.total}),
    h('div',{class:'kpis'},kpi(t.id+'_due',dueWeek,'Due this week'),kpi(t.id+'_over',over,'Overdue',over?'warn':null),kpi(t.id+'_rev',rev,'Marked to revise'),t.id==='dsa'?kpi('dsa_solved',solved(),'Problems solved','good'):kpi(t.id+'_open',c.total-c.done,'Still open')));
  if(t.id==='dsa'){
    var sv=solved(),total=state.log.total,exp=Math.round(total*Math.min(1,(ci+1)/DSA_DAYS));
    ov.appendChild(h('div',{class:'prog'},h('a',{href:'#log',onclick:function(e){e.preventDefault();location.hash='today';}},h('span',{class:'nm'},h('i',{class:'dot',style:'--col:'+tcol('dsa')}),'Problems solved, logged on the Today page'),h('span',{class:'ct',text:sv+' of '+total+', pace '+exp}),
      h('div',{class:'bar',style:'--col:'+tcol('dsa')},h('i',{style:'width:'+Math.min(100,sv/total*100)+'%'}),h('b',{style:'left:'+Math.min(100,exp/total*100)+'%'}))),
      h('div',{class:'addrow',style:'margin-top:.25rem'},h('label',{class:'field',style:'flex:0 1 18rem'},'Problems in the sheet, as TUF+ shows it',
        h('input',{type:'number',min:'1',inputmode:'numeric',value:String(total),onchange:function(e){var v=Math.round(Number(e.target.value));if(v>0){state.log.total=v;save('log');}render();}})))));
  }
  out.push(ov);
  var sid='search_'+t.id;
  var tb=h('div',{class:'toolbar'},
    h('div',{class:'search'},icon('search'),h('input',{class:'input',id:sid,type:'text',placeholder:'Search '+t.name,'aria-label':'Search items in '+t.name,value:ui.q[t.id]||'',autocomplete:'off',oninput:function(e){ui.q[t.id]=e.target.value;ui.refocus=sid;render();}})),
    seg([['all','All'],['today','Today'],['week','This week'],['todo','Not done'],['revise','To revise']],f,function(v){ui.filter[t.id]=v;render();},'Filter items'),
    h('div',{class:'spacer'}),
    h('button',{type:'button',class:'btn ghost sm',onclick:function(){var anyOpen=false;t.groups.forEach(function(g){if(ui.open[t.id+'|'+g.name]!==false&&(ui.open[t.id+'|'+g.name]||g.items.some(function(it){return it.w===cw;})))anyOpen=true;});
      t.groups.concat([{name:'Your additions'}]).forEach(function(g){ui.open[t.id+'|'+g.name]=!anyOpen;});render();}},icon('chevron'),'Expand or collapse all'));
  out.push(tb);
  function keep(it){
    if(f==='today')return it.d0<=ci&&ci<=it.d;
    if(f==='week')return it.w===cw;
    if(f==='todo')return !state.checks.done[it.id];
    if(f==='revise')return !!state.checks.revise[it.id];
    return true;}
  var groups=t.groups.slice(),mine=state.custom.items.filter(function(x){return x.track===t.id;}).map(function(x){return {id:x.id,t:x.title,w:0,custom:true};});
  if(mine.length)groups.push({name:'Your additions',items:mine});
  var shown=0;
  groups.forEach(function(g){
    var list=g.items.filter(keep).filter(function(it){return !q||(it.t+' '+(it.full||'')+' '+g.name).toLowerCase().indexOf(q)>=0;});
    if(!list.length)return;shown++;
    var d=0;g.items.forEach(function(it){if(state.checks.done[it.id])d++;});
    var gk=t.id+'|'+g.name,open=q?true:(gk in ui.open?ui.open[gk]:(f!=='all'||g.items.some(function(it){return it.w===cw;})||g.name==='Your additions'));
    out.push(groupDetails(gk,g.name,d,g.items.length,list.map(function(it){return itemRow(it,t,cw,false);}),{open:open,col:tcol(t.id)}));
  });
  if(!shown)out.push(h('div',{class:'card'},emptyState(q?'search':f==='revise'?'bookmark':'check',
    q?'No matches':f==='revise'?'Nothing marked to revise':f==='today'?'Nothing planned today':f==='week'?'Nothing planned this week':f==='todo'?'Everything is ticked':'No items yet',
    q?'Try a shorter search, or clear the filter.':f==='revise'?'Use Revise on any item you want to come back to.':f==='today'?'Nothing in this track is planned for today.':f==='week'?'Nothing in this track is planned for this week.':f==='todo'?'Every item in this track is done.':'Add your own item below.')));
  var inp=h('input',{class:'input',type:'text',placeholder:'Add your own item to '+t.name,'aria-label':'New item for '+t.name,maxlength:'140'});
  function add(){var v=inp.value.trim();if(!v)return inp.focus();state.custom.items.push({id:'x'+Date.now().toString(36),track:t.id,title:v});save('custom');toast('Added to '+t.name,'plus');render();}
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')add();});
  out.push(h('div',{class:'card',style:'margin-top:1rem'},h('div',{class:'addrow'},inp,h('button',{type:'button',class:'btn',onclick:add},icon('plus'),'Add item'))));
  return out;
}

function viewApps(){
  var out=[],cw=curWeek(),list=state.apps.list,wk=appsThisWeek(cw),mode=ui.appView||(window.innerWidth>=768?'board':'list');
  function cntf(fn){return list.filter(fn).length;}
  out.push(h('div',{class:'page-head'},
    h('div',null,h('h1',{style:'display:flex;align-items:center;gap:.6rem'},h('span',{class:'tic',style:'--col:'+tcol('applications')},icon('briefcase')),'Applications'),h('p',{class:'sub',text:'Aim for '+APP_WEEKLY+' targeted applications a week, referrals first. Drag a card between columns, or change its status, as each one moves.'})),
    h('div',{class:'tools'},seg([['board','Board'],['list','List']],mode,function(v){ui.appView=v;render();},'View'))));
  out.push(h('div',{class:'card'},h('div',{class:'kpis'},
    kpi('a_total',list.length,'Sent in total'),kpi('a_week',wk+' of '+APP_WEEKLY,'Sent this week',wk>=APP_WEEKLY?'good':null),
    kpi('a_open',cntf(function(a){return !CLOSED[a.status];}),'Still open'),kpi('a_int',cntf(function(a){return a.status==='Interviewing';}),'Interviewing','good'),kpi('a_off',cntf(function(a){return a.status==='Offer';}),'Offers','good'))));
  function sel(opts,val){var s=h('select',{class:'sel'});opts.forEach(function(o){s.appendChild(h('option',{value:o,text:o,selected:o===val}));});return s;}
  var fc=h('input',{type:'text',maxlength:'80',autocomplete:'organization'}),fr=h('input',{type:'text',maxlength:'80',placeholder:'AI engineer'}),
      fk=sel(['AI engineer','SDE','Backend','Other'],'AI engineer'),fs=sel(['Referral','Recruiter','Direct','Other'],'Referral'),fd=h('input',{type:'date',value:dkey(now())});
  function addApp(){
    var company=fc.value.trim();
    if(!company){ui.appErr='Add a company name to save this application.';render();return;}
    ui.appErr='';
    state.apps.list.push({id:'a'+Date.now().toString(36),company:company,role:fr.value.trim(),kind:fk.value,source:fs.value,date:fd.value||dkey(now()),status:'Applied',note:''});
    toast('Application added: '+company,'briefcase');confetti(window.innerWidth/2,window.innerHeight/3,24);
    save('apps');render();
  }
  fc.addEventListener('keydown',function(e){if(e.key==='Enter')addApp();});
  out.push(h('div',{class:'sec'},h('h2',{text:'Add an application'})));
  out.push(h('div',{class:'card'},h('div',{class:'addrow'},
    h('label',{class:'field'},'Company',fc),h('label',{class:'field'},'Role',fr),h('label',{class:'field'},'Type',fk),
    h('label',{class:'field'},'Source',fs),h('label',{class:'field'},'Date sent',fd),
    h('button',{type:'button',class:'btn',onclick:addApp},icon('plus'),'Add application')),
    ui.appErr?h('p',{class:'err',role:'alert',text:ui.appErr}):null));
  out.push(h('div',{class:'sec'},h('h2',{text:'Pipeline'}),h('span',{class:'aside',text:mode==='board'?'Drag cards between columns':'Newest first'})));
  if(!list.length){out.push(h('div',{class:'card'},emptyState('inbox','No applications yet','Add the first one above, and start with people who can refer you.')));return out;}
  function statusSel(a){var st=sel(STATUSES,a.status);st.setAttribute('aria-label','Status for '+a.company);st.addEventListener('change',function(){a.status=st.value;save('apps');render();});return st;}
  function removeBtn(a){return h('button',{type:'button',class:'iact danger',onclick:function(){
    if(ui.confirm!==a.id){ui.confirm=a.id;render();setTimeout(function(){if(ui.confirm===a.id){ui.confirm=null;render();}},4000);return;}
    ui.confirm=null;state.apps.list=state.apps.list.filter(function(x){return x.id!==a.id;});save('apps');render();}},icon('trash'),ui.confirm===a.id?'Tap again to remove':'Remove');}
  function subline(a){var d=new Date(a.date+'T00:00:00');return [a.role||a.kind,a.source,isNaN(d)?'':'sent '+fmtShort(d)].filter(Boolean).join(' · ');}
  function noteIn(a){return h('input',{class:'note',type:'text','aria-label':'Next step for '+a.company,placeholder:'Next step, contact or interview date',value:a.note||'',onchange:function(e){a.note=e.target.value.trim();save('apps');}});}
  var sorted=list.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0;});
  if(mode==='board'){
    var board=h('div',{class:'board'});
    STATUSES.forEach(function(s){
      var col=h('section',{class:'col-k','aria-label':s},h('h3',null,s,h('span',{class:'ct',text:String(list.filter(function(a){return a.status===s;}).length)})));
      col.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='move';col.classList.add('over');});
      col.addEventListener('dragleave',function(e){if(!col.contains(e.relatedTarget))col.classList.remove('over');});
      col.addEventListener('drop',function(e){e.preventDefault();col.classList.remove('over');var id=e.dataTransfer.getData('text/plain'),a=list.filter(function(x){return x.id===id;})[0];
        if(a&&a.status!==s){a.status=s;save('apps');render();toast(a.company+' moved to '+s,'briefcase');if(s==='Offer')confetti(window.innerWidth/2,window.innerHeight/3,70);}});
      sorted.filter(function(a){return a.status===s;}).forEach(function(a){
        var note=noteIn(a),card=h('article',{class:'kcard',draggable:'true'},
          h('strong',null,icon('grip','grip'),h('span',{text:a.company})),h('div',{class:'sub',text:subline(a)}),note,h('div',{class:'foot'},statusSel(a),removeBtn(a)));
        note.addEventListener('pointerdown',function(){card.draggable=false;});note.addEventListener('blur',function(){card.draggable=true;});
        card.addEventListener('pointerup',function(){if(document.activeElement!==note)card.draggable=true;});
        card.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',a.id);e.dataTransfer.effectAllowed='move';card.classList.add('drag');});
        card.addEventListener('dragend',function(){card.classList.remove('drag');});
        col.appendChild(card);});
      board.appendChild(col);
    });
    out.push(board);
  }else{
    sorted.forEach(function(a){out.push(h('div',{class:'appcard'},h('div',{class:'who'},h('strong',{text:a.company}),h('div',{text:subline(a)})),statusSel(a),noteIn(a),h('div',{class:'acts'},removeBtn(a))));});
  }
  return out;
}

/* ---------- weekly tests ---------- */
var QS={
d1_1:['Reverse a string without a built-in reverse','FizzBuzz with clean input handling'],d1_2:['Print a diamond pattern for n rows','Print the first n rows of Pascal’s triangle'],d1_3:['Group anagrams','Top k frequent elements'],d1_4:['Count primes below n with a sieve','GCD of two numbers, then LCM of an array'],d1_5:['Check a palindrome recursively','Nth Fibonacci number with memoisation'],d1_6:['First unique character in a string','Longest consecutive sequence'],
d2_1:['Implement insertion sort','Sort colours (Dutch national flag)'],d2_2:['Implement merge sort','Kth largest element with quickselect'],
d3_1:['Move zeroes','Best time to buy and sell stock'],d3_2:['Product of array except self','Subarray sum equals k'],d3_3:['Merge intervals','Reverse pairs'],
d4_1:['Search in a rotated sorted array','First and last position of an element in a sorted array'],d4_2:['Koko eating bananas','Split array largest sum'],d4_3:['Search a 2D matrix II','Find a peak element II'],
d6_1:['Reverse a linked list','Middle of the linked list'],d6_2:['Design browser history','Flatten a multilevel doubly linked list'],d6_3:['Remove the nth node from the end','Add two numbers'],d6_4:['LRU cache','Remove duplicates from a sorted doubly linked list'],d6_5:['Reverse nodes in k-group','Copy list with random pointer'],
d9_1:['Implement a queue using stacks','Min stack'],d9_2:['Evaluate reverse Polish notation','Basic calculator II'],d9_3:['Daily temperatures','Largest rectangle in a histogram'],d9_4:['Sliding window maximum','LFU cache'],
d10_1:['Longest substring without repeating characters','Fruit into baskets'],d10_2:['Minimum window substring','Subarrays with k different integers'],
d13_1:['Binary tree level order traversal','Iterative inorder traversal'],d13_2:['Diameter of a binary tree','Lowest common ancestor of a binary tree'],d13_3:['Binary tree maximum path sum','Serialize and deserialize a binary tree'],
d14_1:['Validate a binary search tree','Insert into a binary search tree'],d14_2:['Kth smallest element in a BST','Recover a binary search tree'],
d11_1:['Implement a min-heap with push and pop','Kth largest element in an array'],d11_2:['Task scheduler','K closest points to origin'],d11_3:['Find the median from a data stream','Merge k sorted lists'],
d15_1:['Number of provinces','Clone graph'],d15_2:['Rotting oranges','Number of islands'],d15_3:['Course schedule II','Alien dictionary'],d15_4:['Network delay time','Cheapest flights within k stops'],d15_5:['Min cost to connect all points','Accounts merge'],d15_6:['Critical connections in a network','Count strongly connected components'],
d7_1:['Pow(x, n)','Generate parentheses'],d7_2:['Subsets II','Combination sum'],d7_3:['N-Queens','Word search'],
d5_1:['Valid anagram','Longest common prefix'],d5_2:['Longest palindromic substring','String to integer (atoi)'],
d16_1:['Climbing stairs','Min cost climbing stairs'],d16_2:['House robber II','Decode ways'],d16_3:['Unique paths II','Minimum path sum'],d16_4:['Partition equal subset sum','Coin change'],d16_5:['Longest common subsequence','Edit distance'],d16_6:['Best time to buy and sell stock with cooldown','Best time to buy and sell stock III'],d16_7:['Longest increasing subsequence','Russian doll envelopes'],d16_8:['Burst balloons','Palindrome partitioning II'],d16_9:['Maximal square','Count square submatrices with all ones'],
d12_1:['Assign cookies','Lemonade change'],d12_2:['Jump game II','Non-overlapping intervals'],
d8_1:['Number of 1 bits','Power of two'],d8_2:['Single number II','Generate all subsets using bitmasks'],d8_3:['Prime factorisation of n','Count primes in a range with a segmented sieve'],
d17_1:['Implement a trie with insert, search and startsWith'],d17_2:['Word search II','Maximum XOR of two numbers in an array'],d18_1:['Shortest palindrome, using KMP','Repeated string match, using Rabin–Karp'],
s01:['How would you scale a read-heavy service from one server to a million users? Where do the load balancer, cache and CDN each go?'],s02:['When would you pick a relational database over NoSQL? How does an index speed up a query, and what does it cost?'],s03:['Explain leader and follower replication and replication lag. How would you choose a shard key for a users table?'],s04:['State the CAP theorem with a real example. What is the difference between strong and eventual consistency?'],s05:['When would you put a queue between two services? Explain at-least-once delivery and how consumers stay idempotent.'],s06:['Design the API for a payments endpoint: versioning, pagination, idempotency keys and error format.'],s07:['How does consistent hashing work, and what problem do virtual nodes solve?'],s08:['Estimate the storage and requests per second for a service with 100 million daily users posting twice a day.'],
s10:['Design a URL shortener handling 100 million new links a month. Cover ID generation, storage, caching and redirects.'],s11:['Design a distributed rate limiter for an API gateway. Compare token bucket and sliding window.'],s12:['Design a news feed for 50 million users. Compare fan-out on write with fan-out on read.'],s13:['Design one-to-one and group chat with delivery and read receipts.'],s14:['Design a notification system for push, SMS and email, with retries and user preferences.'],s15:['Design a payments system that never double-charges. Cover idempotency, the ledger and reconciliation.'],s16:['Design search autocomplete that returns suggestions in under 100 milliseconds.'],s17:['Design a web crawler for a billion pages. Cover politeness, deduplication and the URL frontier.'],s18:['Design a video streaming service: upload, transcoding, storage and adaptive playback.'],s19:['Design a ride-hailing service: driver location updates, matching and trip state.'],s20:['Design a file storage and sync service with chunking, deduplication and conflict handling.'],s21:['Design a ticket booking system that never sells the same seat twice.'],s22:['Design a distributed cache: eviction, replication and avoiding a thundering herd.'],s23:['Design a distributed job scheduler with retries, and say what guarantee you can give about running a job once.'],s24:['Design a metrics and monitoring system ingesting a million data points a second.'],
l01:['Explain each SOLID principle with a one-line Python example, and name one you have seen broken.'],l02:['When would you use an abstract base class over duck typing? What do dataclasses and enums give you?'],l03:['Draw the class diagram for a library system and talk through each relationship aloud.'],l04:['Implement a payment processor that swaps between card, UPI and wallet using the strategy pattern.'],l05:['Implement a factory that creates email, SMS and push senders. When is a factory overkill?'],l06:['Implement a stock-price ticker that notifies subscribers of changes, using the observer pattern.'],l07:['Model an order moving through placed, paid, shipped and delivered using the state pattern.'],l08:['Write a Python decorator that retries a function with backoff, then explain the decorator pattern in OOP terms.'],l09:['Build a query builder for SQL SELECT statements using the builder pattern.'],l10:['Implement a thread-safe singleton in Python. Why is singleton often called an anti-pattern?'],
l11:['Design a parking lot with several floors, vehicle sizes and hourly pricing.'],l12:['Design and code an LRU cache with O(1) get and put.'],l13:['Design a vending machine with idle, has-money, dispensing and out-of-stock states.'],l14:['Design a logging framework with levels, several sinks and formatters.'],l15:['Design movie ticket booking with shows, seats and seat locking during payment.'],l16:['Design tic-tac-toe for an n by n board with O(1) win detection.'],l17:['Design snake and ladder for several players with a configurable board and dice.'],l18:['Design a library management system: members, loans, reservations and fines.'],l19:['Design a notification service with channels, templates, retries and rate limits.'],l20:['Design an elevator system for a building with several lifts and a scheduling strategy.'],
m01:['Build Splitwise in 90 minutes: users, groups, equal, exact and percentage splits, and a simplified balance view.'],m02:['Build an elevator controller in 90 minutes for several lifts, with requests from floors and from inside the car.'],m03:['Build a rate limiter library in 90 minutes supporting token bucket and sliding window per user.'],m04:['Build a booking system in 90 minutes with conflict detection and cancellation.'],m05:['Build an in-memory key-value store in 90 minutes with get, set, delete, TTL and nested transactions.'],m06:['Build snake and ladder in 90 minutes for n players, with a driver that plays a full game.'],m07:['Build a parking lot in 90 minutes with entry, exit, slot allocation and fee calculation.'],m08:['Build a task scheduler in 90 minutes with priorities, delays, recurring tasks and a worker pool.'],m09:['Build a food ordering system in 90 minutes: restaurants, menus, cart, order assignment and status.'],m10:['Build a pub-sub system in 90 minutes with topics, consumer offsets and replay.'],m11:['Build a cab booking system in 90 minutes: riders, drivers, nearest-driver matching and trip billing.'],
b01:['Tell me about yourself.'],b02:['Why are you leaving your current role?'],b05:['Walk me through your resume.'],b03:['Why do you want to work here, and why this role?'],b04:['What are your strengths, and what is a real weakness you are working on?'],b10:['Tell me about a project you owned from start to finish.'],b11:['What is the hardest technical problem you have solved?'],b12:['Tell me about a conflict with a teammate or stakeholder and how you resolved it.'],b13:['Tell me about a time you failed. What did you change afterwards?'],b14:['Tell me about a time you had to deliver against a tight deadline.'],b15:['Tell me about a time you disagreed with a decision. What did you do?'],b16:['Tell me about a time you led or mentored others.'],b17:['Tell me about a time you had to make progress with unclear requirements.'],b18:['Tell me about a time you went beyond what was asked for a customer or user.'],b19:['Tell me about a decision where you had to trade one good thing for another.'],b20:['What questions do you have for us?'],b21:['What are your salary expectations, and when can you join?'],b22:['We would like to make you an offer at this number. How do you respond?'],
a01:['Explain self-attention step by step. Why is the dot product scaled by the square root of the key dimension?'],a02:['How does byte pair encoding work? What limits the context window, and what happens when you exceed it?'],a03:['Compare temperature, top-k and top-p sampling. What would you set for code generation, and why?'],a04:['What is an embedding, and why use cosine similarity? How would you choose an embedding model?'],a05:['When does few-shot beat zero-shot? How do you get reliable JSON out of a model?'],a06:['Walk through a RAG pipeline from ingestion to the final answer, naming where each failure can occur.'],a07:['Compare fixed-size, recursive and semantic chunking. How do you choose chunk size and overlap?'],a08:['How does HNSW work, and how does it differ from IVF? What trades recall against latency?'],a09:['Why combine BM25 with dense retrieval? What does a cross-encoder reranker add, and what does it cost?'],a10:['How do you evaluate retrieval and generation separately in RAG? Define faithfulness and recall at k.'],a11:['Design an LLM-as-judge evaluation. What biases does it have, and how do you correct for them?'],a12:['How does function calling work end to end? How do you handle a malformed or failed tool call?'],a13:['Explain the ReAct loop. How do you stop an agent looping forever or running up cost?'],a14:['When is a multi-agent design worth it over one agent? How is state shared and checkpointed in a graph-based orchestrator?'],a15:['What is the Model Context Protocol, and how does it differ from plain function calling?'],a16:['Prompting, RAG or fine-tuning: how do you decide? Explain LoRA and how you choose the rank.'],a17:['What does quantisation do to a model, and what breaks at 4 bits? What does continuous batching buy you?'],a18:['List every lever for cutting LLM cost and latency, and rank them for a chat product.'],a19:['What is indirect prompt injection? Describe a layered defence for an agent that reads web pages.'],a20:['Why do LLMs hallucinate, and how would you detect and reduce it in production?'],a21:['What would you trace and log in a production LLM app? How do you version prompts and roll back?'],a22:['Explain the bias and variance trade-off. When would you optimise for precision over recall?'],a23:['Budget the latency of a real-time voice agent across speech-to-text, the LLM and text-to-speech. How do you handle interruptions?'],
c01:['Implement cosine similarity and top-k retrieval over a list of vectors without a vector library.'],c02:['Implement a text chunker with overlap that never splits a sentence.'],c03:['Implement BM25 scoring from scratch for a small corpus.'],c04:['Build a minimal RAG pipeline: chunk, embed, retrieve and answer with citations.'],c05:['Implement an agent loop with tool dispatch, error handling and a step budget, without a framework.'],c06:['Write a FastAPI endpoint that streams tokens to the client with server-sent events.'],c07:['Write an async batch caller with a concurrency limit, retries with jitter and per-item error isolation.'],c08:['Parse and validate model output against a Pydantic schema, retrying with the error message on failure.'],c09:['Implement an LLM response cache with exact-match and semantic lookup, plus a TTL.'],c10:['Implement conversation memory that stays inside a token budget by summarising older turns.'],c11:['Write an evaluation harness that scores a RAG system on a small labelled set.'],c12:['Implement scaled dot-product attention with a causal mask in NumPy.'],
g01:['Design an enterprise RAG assistant over 10 million documents with per-user permissions.'],g02:['Design a platform for multi-step agent workflows with retries, human approval and audit logs.'],g03:['Design evaluation and monitoring for an LLM product: offline evals, online signals and a release gate.'],g04:['Design a real-time voice agent for customer calls that responds in under a second.'],g05:['Design a customer support bot that can take real actions, with guardrails and escalation to humans.'],g06:['Design multi-tenant document Q&A where no tenant can ever see another tenant’s data.'],g07:['Design an LLM gateway: routing across providers, failover, caching, budgets and rate limits.'],g08:['Design semantic search over a catalogue of 100 million products.'],
p01:['What is the GIL? When would you use threads, processes or asyncio?'],p02:['How does the asyncio event loop work? What happens if you call a blocking function inside a coroutine?'],p03:['What is the difference between an iterator and a generator? Write a decorator that times a function.'],p04:['How does a context manager work? Explain reference counting and the garbage collector.'],p05:['How does dependency injection work in FastAPI? When should an endpoint be async def rather than def?'],p06:['How does JWT authentication work, and how do you revoke a token? Outline the OAuth authorisation code flow.'],p07:['Write a query for the second-highest salary in each department using a window function.'],p08:['When does a query not use an index? Explain the isolation levels and one anomaly each prevents.'],p09:['Compare cache-aside with write-through caching. How do you make a POST endpoint idempotent?'],p10:['What is the difference between an image and a container? Describe the CI/CD pipeline you would set up for an API.'],p11:['Pick two AWS services you have used. Explain how they work and why you chose them.'],
j01:['Walk me through your RAG project. Why that chunking, that retriever and that model, and how did you measure quality?'],j02:['Walk me through your agent project. Why that orchestration, and what broke in production?'],j03:['Walk me through your voice project. Where did the latency go, and how did you reduce it?'],j04:['Walk me through your resume in three minutes, then answer two follow-up questions aloud.']
};
var LIVE_FROM=9,PART_NAMES={live:'Live mocks',dsa:'DSA',sd:'System design',lld:'LLD and machine coding',ai:'AI rounds',beh:'Behavioural'};
function testParts(w){
  var skip={'Mock interviews':1,'Practice':1,'Revision':1,'Company question bank':1},parts=[];
  function items(tid){var out=[];TRACKS.forEach(function(t){if(t.id===tid)t.groups.forEach(function(g){if(!skip[g.name])g.items.forEach(function(it){if(it.w===w)(QS[it.id]||[it.full||it.t]).forEach(function(q){out.push(q);});});});});return out;}
  function add(k,name,mins,task,list){if(list.length||k==='live')parts.push({k:k,name:name,mins:mins,task:task,list:list});}
  if(w>=LIVE_FROM)add('live','Live mock interview',60,'Book and sit one live mock this week, rotating between DSA, system design and AI rounds. Score how it went and note the feedback you got.',[]);
  add('dsa','DSA, timed',90,'Pick three problems below that you have not solved recently and give each one 30 minutes. No hints and no editorial until the timer ends.',items('dsa'));
  add('sd','System design',45,'Answer one design question in full from a blank page, speaking aloud as you would to an interviewer. Give a two-minute answer to each of the others.',items('system-design'));
  add('lld','LLD and machine coding',60,'Pick one build question and write working code from scratch, without opening your earlier solution. Answer the others aloud.',items('lld'));
  add('ai','AI rounds',30,'Answer each question below aloud in about three minutes, then check yourself against your notes. For a coding question, write the code.',items('ai'));
  add('beh','Behavioural',15,'Answer each question below aloud in two minutes or less, and record yourself.',items('behavioural'));
  return parts;
}
function testsDone(){var n=0,k;for(k in state.tests.weeks)if(state.tests.weeks[k].done)n++;return n;}
function testScore(w){
  var rec=state.tests.weeks['w'+w],parts=testParts(w),got=0,n=0;
  if(rec&&rec.scores)parts.forEach(function(p){if(rec.scores[p.k]!=null){got+=rec.scores[p.k];n++;}});
  return {got:got,max:parts.length*5,scored:n};
}
function setScore(w,parts,k,v){
  var key='w'+w,rec=state.tests.weeks[key]||{scores:{},note:''},was=!!rec.done;
  rec.scores[k]=v;
  if(!was&&parts.every(function(p){return rec.scores[p.k]!=null;}))rec.done=dkey(now());
  state.tests.weeks[key]=rec;save('tests');render();
  if(!was&&rec.done){var sc=testScore(w);toast('Week '+w+' test complete: '+sc.got+' of '+sc.max,'trophy');confetti(window.innerWidth/2,window.innerHeight/3,60);}
}
function scoreCtl(val,onPick,label){
  var s=h('div',{class:'score',role:'group','aria-label':label});
  [0,1,2,3,4,5].forEach(function(v){s.appendChild(h('button',{type:'button','data-v':String(v),'aria-pressed':val===v?'true':'false','aria-label':label+': '+v,text:String(v),onclick:function(){onPick(v);}}));});
  return s;
}
function viewTests(){
  var out=[],idx=dayIndex(now()),due=Math.max(0,Math.min(WEEKS,Math.floor((idx-1)/7))),w,k;
  out.push(h('div',{class:'page-head'},h('div',null,h('h1',{style:'display:flex;align-items:center;gap:.6rem'},h('span',{class:'tic',style:'--col:'+tcol('weekly-test')},icon('clipboard')),'Weekly tests'),
    h('p',{class:'sub',text:'Every Sunday, test yourself on the week that just ended: closed book, on a timer, scored honestly. You run these yourself until the end of January. From February, each week adds one live mock on a platform.'})),
    h('div',{class:'tools'},[['Exponent peer practice','https://www.tryexponent.com/practice'],['DSA mocks','https://www.tryexponent.com/practice/data-structures-and-algorithms-mock-interviews'],['System design mocks','https://www.tryexponent.com/practice/system-design-mock-interviews']].map(function(l){return h('a',{class:'btn ghost sm',href:l[1],target:'_blank',rel:'noopener noreferrer'},l[0],icon('ext'));}))));
  var sum=0,cnt_=0,per={};
  for(w=1;w<=WEEKS;w++){var rec=state.tests.weeks['w'+w];if(rec&&rec.done){var sc=testScore(w);sum+=sc.got/sc.max;cnt_++;}
    if(rec&&rec.scores)for(k in rec.scores){per[k]=per[k]||[0,0];per[k][0]+=rec.scores[k];per[k][1]++;}}
  var weak=null;for(k in per){var av=per[k][0]/per[k][1];if(PART_NAMES[k]&&(!weak||av<weak[1]))weak=[k,av];}
  var cols=h('div',{class:'cols'});
  cols.appendChild(h('div',{class:'goal',style:'bottom:80%'},h('span',{text:'80%'})));
  for(w=1;w<=WEEKS;w++){(function(w){var s2=testScore(w),pct=s2.scored?s2.got/s2.max*100:0,key='test|'+w;
    var col=h('div',{class:'col'+(s2.scored?'':' zero')+(w===Math.max(1,due)?' today':''),style:'--col:'+tcol('weekly-test'),tabindex:'0',role:'button','aria-label':'Week '+w+': '+(s2.scored?s2.got+' of '+s2.max:'not taken'),onclick:function(){ui.open[key]=true;render();var el=document.getElementById('test_'+w);if(el)el.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'start'});}},h('i',{style:'height:'+(s2.scored?Math.max(4,pct):0)+'%'}));
    tipOn(col,['Week '+w,s2.scored?s2.got+' of '+s2.max+' ('+Math.round(pct)+'%)':w<=due?'Not taken yet':'Upcoming']);cols.appendChild(col);})(w);}
  out.push(h('div',{class:'card'},h('div',{class:'kpis'},
    kpi('t_done',cnt_+' of '+WEEKS,'Tests completed'),kpi('t_avg',cnt_?Math.round(sum/cnt_*100)+'%':'–','Average score',cnt_&&sum/cnt_>=.8?'good':null),
    kpi('t_weak',weak?PART_NAMES[weak[0]]:'–',weak?'Weakest area, averaging '+weak[1].toFixed(1)+' of 5':'Weakest area, once you have scores',weak?'warn':null)),
    h('div',{class:'chart tall'},cols,h('div',{class:'ax'},h('span',{text:'Week 1'}),h('span',{text:'Score by week, tap a bar to open that test'}),h('span',{text:'Week '+WEEKS})))));
  out.push(h('div',{class:'sec'},h('h2',{text:'How to score'})));
  out.push(h('div',{class:'card'},h('div',{class:'grade'},
    h('div',null,h('b',{style:'background:var(--good)',text:'5'}),'Clean and inside the time'),h('div',null,h('b',{style:'background:var(--good)',text:'4'}),'Right, with small slips'),
    h('div',null,h('b',{style:'background:var(--warn-fill);color:#1a1200',text:'3'}),'Partly right, or over time'),h('div',null,h('b',{style:'background:var(--bad)',text:'2'}),'Mostly stuck'),
    h('div',null,h('b',{style:'background:var(--bad)',text:'1'}),'Could not start'),h('div',null,h('b',{style:'background:var(--bad)',text:'0'}),'Skipped'))));
  out.push(h('div',{class:'sec'},h('h2',{text:'Tests'}),h('span',{class:'aside',text:'Week '+Math.max(1,due)+' is the one due now'})));
  for(w=1;w<=WEEKS;w++){(function(w){
    var parts=testParts(w),rec=state.tests.weeks['w'+w]||{scores:{},note:''},sc=testScore(w),day=addDays(START,w*7+1),key='test|'+w;
    var open=key in ui.open?ui.open[key]:w===Math.max(1,due);
    var statusPill=sc.scored?h('span',{class:'pill '+(rec.done?'good':'primary')},icon(rec.done?'check':'pencil'),sc.got+' of '+sc.max):h('span',{class:'pill'},w<=due?'Not taken yet':'Upcoming');
    var det=h('details',{class:'grp'+(rec.done?' complete':''),open:open,id:'test_'+w},h('summary',null,
      h('span',{class:'tsum'},h('span',{text:'Week '+w+' test'+(w>=LIVE_FROM?', with a live mock':'')}),h('small',{text:fmt(day)})),statusPill,icon('chevron','chev')));
    det.addEventListener('toggle',function(){ui.open[key]=det.open;});
    var body=h('div',{class:'body'});
    parts.forEach(function(p){
      var tk=w+'|'+p.k,running=ui.timer&&ui.timer.key===tk;
      var box=h('div',{class:'part'},h('h3',null,p.name,h('span',{class:'pill'},icon('timer'),p.mins+' min')),h('p',{text:p.task}));
      if(p.list.length){var ol=h('ol');p.list.forEach(function(x){ol.appendChild(h('li',{text:x}));});box.appendChild(ol);}
      box.appendChild(h('div',{class:'row'},
        h('button',{type:'button',class:'btn '+(running?'danger':'ghost')+' sm',onclick:function(){if(running)stopTimer();else startTimer(tk,p.mins,'Week '+w+': '+p.name);}},icon(running?'square':'play'),running?'Stop the timer':'Start '+p.mins+'-minute timer'),
        h('span',{class:'scorelab',text:'Score'}),scoreCtl(rec.scores[p.k],function(v){setScore(w,parts,p.k,v);},'Score for '+p.name)));
      body.appendChild(box);
    });
    body.appendChild(h('input',{class:'note',type:'text',style:'margin:.25rem 0 .75rem','aria-label':'Notes for week '+w+' test',placeholder:'What went wrong, and what to fix next week',value:rec.note||'',onchange:function(e){
      var r2=state.tests.weeks['w'+w]||{scores:{},note:''};r2.note=e.target.value.trim();state.tests.weeks['w'+w]=r2;save('tests');}}));
    det.appendChild(body);out.push(det);
  })(w);}
  return out;
}

/* ---------- overlays: command palette and settings ---------- */
var overlay=document.getElementById('overlay');
function closeOverlay(){overlay.classList.remove('on');overlay.textContent='';ui.overlay=null;ui.pal=null;}
overlay.addEventListener('click',function(e){if(e.target===overlay)closeOverlay();});
function openPalette(){
  ui.overlay='palette';ui.pal={q:'',sel:0};overlay.textContent='';
  var input=h('input',{type:'text',placeholder:'Jump to a section, search items, or run an action','aria-label':'Search and commands',autocomplete:'off',oninput:function(e){ui.pal.q=e.target.value;ui.pal.sel=0;drawPal();}});
  var list=h('div',{class:'pal-list',role:'listbox',id:'pal-list'});
  var dlg=h('div',{class:'dialog',role:'dialog','aria-label':'Search and commands'},h('div',{class:'pal-in'},icon('search'),input,h('span',{class:'kbd',text:'Esc'})),list,
    h('div',{class:'pal-foot'},h('span',null,h('span',{class:'kbd',text:'↑↓'}),' move'),h('span',null,h('span',{class:'kbd',text:'Enter'}),' open'),h('span',null,h('span',{class:'kbd',text:'⌘K'}),' toggle')));
  overlay.appendChild(dlg);overlay.classList.add('on');
  ui.pal.list=list;drawPal();input.focus();
}
function palItems(q){
  q=q.trim().toLowerCase();
  var secs=TABS.filter(function(t){return !q||t[1].toLowerCase().indexOf(q)>=0;}).map(function(t){return {sec:'Go to',icon:META[t[0]].icon,col:META[t[0]].col,label:t[1],sub:navCount(t[0]),run:function(){location.hash=t[0];}};});
  var todayK=dkey(now()),dd=state.log.days[todayK]||{};
  var acts=[
    {icon:'plus',label:'Log one DSA problem for today',run:function(){logDay(todayK,'dsa',(Number(dd.dsa)||0)+1);toast('Logged one problem','check');}},
    {icon:'timer',label:'Log 30 minutes of study for today',run:function(){logDay(todayK,'hours',(Number(dd.hours)||0)+0.5);toast('Logged 30 minutes','check');}},
    {icon:'timer',label:'Start a 25-minute focus session',run:function(){startFocus(25);}},
    {icon:'timer',label:'Start a 50-minute focus session',run:function(){startFocus(50);}},
    {icon:'moon',label:'Switch theme',run:cycleTheme},
    {icon:'download',label:'Export a backup',run:exportBackup},
    {icon:'sliders',label:'Open settings',run:openSettings}
  ].filter(function(a){return !q||a.label.toLowerCase().indexOf(q)>=0;}).map(function(a){a.sec='Actions';a.sub='';return a;});
  var found=[];
  if(q.length>=2)TRACKS.forEach(function(t){t.groups.forEach(function(g){g.items.forEach(function(it){
    if(found.length<8&&(it.t+' '+(it.full||'')+' '+g.name).toLowerCase().indexOf(q)>=0)found.push({sec:'Items',icon:META[t.id].icon,col:META[t.id].col,label:it.full||it.t,sub:t.name+(state.checks.done[it.id]?', done':''),run:function(){jumpTo(t,g,it);}});
  });});});
  return q?found.concat(secs,acts):secs.concat(acts);
}
function jumpTo(t,g,it){ui.filter[t.id]='all';ui.q[t.id]='';ui.open[t.id+'|'+g.name]=true;ui.hl=it.id;if(route()===t.id)render();else location.hash=t.id;}
function drawPal(){
  var list=ui.pal.list,items=palItems(ui.pal.q),last=null;list.textContent='';ui.pal.items=items;
  if(!items.length){list.appendChild(h('div',{class:'empty',style:'border:0;padding:1.5rem'},h('b',{text:'Nothing matches'}),h('p',{text:'Try a different word.'})));return;}
  items.forEach(function(it,i){
    if(it.sec!==last){last=it.sec;list.appendChild(h('div',{class:'pal-sec',text:it.sec}));}
    var b=h('button',{type:'button',class:'pal-item',role:'option','aria-selected':i===ui.pal.sel?'true':'false',style:it.col?'--track:'+it.col:null,onclick:function(){closeOverlay();it.run();}},icon(it.icon),h('span',{text:it.label}),it.sub?h('span',{class:'sub',text:it.sub}):null);
    b.addEventListener('mousemove',function(){if(ui.pal.sel!==i){ui.pal.sel=i;markPal();}});
    list.appendChild(b);
  });
}
function markPal(){var els=ui.pal.list.querySelectorAll('.pal-item');els.forEach(function(el,i){el.setAttribute('aria-selected',i===ui.pal.sel?'true':'false');});var cur=els[ui.pal.sel];if(cur)cur.scrollIntoView({block:'nearest'});}
function palKey(e){
  if(!ui.pal||!ui.pal.items)return;
  var n=ui.pal.items.length;
  if(e.key==='ArrowDown'){e.preventDefault();ui.pal.sel=(ui.pal.sel+1)%Math.max(1,n);markPal();}
  else if(e.key==='ArrowUp'){e.preventDefault();ui.pal.sel=(ui.pal.sel-1+n)%Math.max(1,n);markPal();}
  else if(e.key==='Enter'){e.preventDefault();var it=ui.pal.items[ui.pal.sel];if(it){closeOverlay();it.run();}}
}
function exportBackup(){
  var blob=new Blob([JSON.stringify({app:'interview-prep-tracker',version:1,exported:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
  var a=h('a',{href:URL.createObjectURL(blob),download:'interview-prep-backup-'+dkey(now())+'.json'});document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);toast('Backup downloaded','download');
}
function importBackup(file){
  var r=new FileReader();
  r.onload=function(){try{var o=JSON.parse(r.result),d=o&&o.data&&typeof o.data==='object'?o.data:o;if(!d||!DOCS.some(function(n){return d[n];}))throw 0;
    DOCS.forEach(function(n){state[n]=norm(n,d[n]);save(n);});closeOverlay();render();toast('Backup restored','upload');}catch(e){toast('That file is not a tracker backup','x');}};
  r.readAsText(file);
}
function openSettings(){
  ui.overlay='settings';overlay.textContent='';
  var file=h('input',{type:'file',accept:'application/json,.json',class:'vh',id:'importFile',onchange:function(e){if(e.target.files[0])importBackup(e.target.files[0]);}});
  var clearBtn=h('button',{type:'button',class:'btn danger sm',text:'Clear all progress',onclick:function(){
    if(ui.confirm!=='reset'){ui.confirm='reset';clearBtn.textContent='Tap again to clear everything';setTimeout(function(){if(ui.confirm==='reset'){ui.confirm=null;clearBtn.textContent='Clear all progress';}},4000);return;}
    ui.confirm=null;DOCS.forEach(function(n){state[n]=norm(n,null);save(n);});numPrev={};ringPrev={};closeOverlay();render();toast('Everything cleared','rotate');}});
  var dlg=h('div',{class:'dialog sheet',role:'dialog','aria-label':'Settings'},
    h('button',{type:'button',class:'ibtn close','aria-label':'Close',onclick:closeOverlay},icon('x')),
    h('h2',{text:'Settings'}),h('p',{class:'sub',style:'color:var(--muted);margin:0 0 .5rem;font-size:.9375rem',text:'Theme, backups and a reset. Progress lives in this browser'+(store?' and in your account':'')+'.'}),
    h('div',{class:'row'},h('div',null,h('b',{text:'Theme'}),h('span',{text:'Follow your system, or pick one.'})),seg([['system','System'],['light','Light'],['dark','Dark']],getTheme(),function(v){applyTheme(v);openSettings();},'Theme')),
    h('div',{class:'row'},h('div',null,h('b',{text:'Back up your progress'}),h('span',{text:'Download a JSON file with every tick, log, application and test score.'})),h('button',{type:'button',class:'btn ghost sm',onclick:exportBackup},icon('download'),'Export')),
    h('div',{class:'row'},h('div',null,h('b',{text:'Restore a backup'}),h('span',{text:'Replaces what is on this device with the file you pick.'})),h('label',{class:'btn ghost sm',for:'importFile',style:'cursor:pointer'},icon('upload'),'Import',file)),
    h('div',{class:'row'},h('div',null,h('b',{text:'Start over'}),h('span',{text:'Removes every tick, log, application and score on this device.'})),clearBtn),
    h('div',{class:'row'},h('div',null,h('b',{text:'Keyboard'}),h('span',null,h('span',{class:'kbd',text:'⌘K'}),' or ',h('span',{class:'kbd',text:'Ctrl K'}),' opens search and commands. ',h('span',{class:'kbd',text:'Esc'}),' closes it.'))));
  overlay.appendChild(dlg);overlay.classList.add('on');
}

/* ---------- start ---------- */
document.querySelectorAll('[data-search]').forEach(function(b){b.appendChild(icon('search'));b.addEventListener('click',openPalette);});
document.querySelectorAll('[data-settings]').forEach(function(b){b.appendChild(icon('sliders'));b.addEventListener('click',openSettings);});
document.querySelectorAll('[data-theme-btn]').forEach(function(b){b.addEventListener('click',cycleTheme);});
applyTheme(getTheme());
document.addEventListener('keydown',function(e){
  if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){e.preventDefault();if(ui.overlay==='palette')closeOverlay();else openPalette();return;}
  if(e.key==='Escape'&&ui.overlay){closeOverlay();return;}
  if(ui.overlay==='palette')palKey(e);
});
loadLocal();
render();
window.addEventListener('hashchange',function(){render();if(!ui.scrolled)window.scrollTo(0,0);});
window.addEventListener('resize',function(){if(route()==='applications'&&!ui.appView)render();});
connect();
})();
