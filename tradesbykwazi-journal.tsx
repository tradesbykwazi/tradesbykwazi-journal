import { useState, useEffect } from "react";

const DARK = {
  bg:"#0A0C10",surface:"#111318",card:"#161A22",border:"#1F2430",
  cyan:"#00D4FF",cyanDim:"#00D4FF22",gold:"#FFD166",green:"#06D6A0",
  red:"#EF4444",purple:"#A78BFA",text:"#E8EAF0",muted:"#6B7280",white:"#FFFFFF",
  inputBg:"#0A0C10",shadow:"0 4px 24px rgba(0,0,0,0.5)",
};
const LIGHT = {
  bg:"#F0F4F8",surface:"#FFFFFF",card:"#FFFFFF",border:"#E2E8F0",
  cyan:"#0096B7",cyanDim:"#0096B722",gold:"#D4A017",green:"#059669",
  red:"#DC2626",purple:"#7C3AED",text:"#1A202C",muted:"#718096",white:"#FFFFFF",
  inputBg:"#F7FAFC",shadow:"0 2px 12px rgba(0,0,0,0.08)",
};

const CURRENCY_SYMBOL = {USD:"$",ZAR:"R",EUR:"€",GBP:"£"};
const getCurrencySymbol = (c) => CURRENCY_SYMBOL[c] || c || "$";
const fmtMoneyCur = (n, currency) => {
  if (n == null) return "—";
  const s = getCurrencySymbol(currency);
  return (n >= 0 ? "+" : "-") + s + Math.abs(n).toFixed(2);
};
const clr = (n, T) => n >= 0 ? T.green : T.red;
const uid = () => Math.random().toString(36).slice(2,10);
const maxConsec = (trades, wins) => {
  let max=0,cur=0;
  [...trades].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>{
    if((wins&&t.pnl>0)||(!wins&&t.pnl<0)){cur++;max=Math.max(max,cur);}else cur=0;
  });
  return max;
};

function lsGet(key, fb) {
  try { const v=localStorage.getItem(key); if(v!=null) return JSON.parse(v); } catch(_){}
  return fb;
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(_){}
}

const CFD_SIZES = {
  EURUSD:100000,GBPUSD:100000,USDJPY:100000,USDCHF:100000,AUDUSD:100000,
  NZDUSD:100000,USDCAD:100000,EURGBP:100000,EURJPY:100000,GBPJPY:100000,
  XAUUSD:100,XAGUSD:5000,XPTUSD:100,XPDUSD:100,
  US30:1,US500:1,US100:1,GER40:1,UK100:1,AUS200:1,
  USOIL:1000,UKOIL:1000,BTCUSD:1,ETHUSD:1,
};
const FUTURES_LEV=[{l:"Micro (1:10)",v:10},{l:"Mini (1:20)",v:20},{l:"Std (1:50)",v:50},{l:"Custom",v:"custom"}];
const CFD_LEV=[{l:"1:10",v:10},{l:"1:30",v:30},{l:"1:50",v:50},{l:"1:100",v:100},{l:"1:200",v:200},{l:"1:500",v:500},{l:"Custom",v:"custom"}];
const EMOTIONS=[
  {e:"😌",l:"Calm"},{e:"💪",l:"Confident"},{e:"🎯",l:"Focused"},
  {e:"😤",l:"Frustrated"},{e:"😰",l:"Anxious"},{e:"😡",l:"Vengeful"},
  {e:"🔥",l:"Overexcited"},{e:"😴",l:"Tired"},{e:"😕",l:"Uncertain"},{e:"🤯",l:"Overwhelmed"},
];

function fileToBase64(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>res(e.target.result);
    r.onerror=()=>rej(new Error("fail"));
    r.readAsDataURL(file);
  });
}

// ── Tiny charts ──────────────────────────────────────────────────────────────
function Spark({data,w=120,h=36,color}) {
  if(!data||data.length<2) return null;
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-mn)/rng)*h}`).join(" ");
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/></svg>;
}
function EqCurve({equity,height=160,T}) {
  if(!equity||equity.length<2) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted}}>No data</div>;
  const W=800,H=height,mn=Math.min(...equity,0),mx=Math.max(...equity,0),rng=mx-mn||1;
  const pts=equity.map((v,i)=>[(i/(equity.length-1))*W,H-((v-mn)/rng)*(H-20)-10]);
  const d=pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const zY=H-((0-mn)/rng)*(H-20)-10;
  const last=equity[equity.length-1];
  const c=last>=0?T.green:T.red;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height}} preserveAspectRatio="none">
      <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.3"/><stop offset="100%" stopColor={c} stopOpacity="0"/></linearGradient></defs>
      <line x1={0} y1={zY} x2={W} y2={zY} stroke={T.border} strokeWidth={1}/>
      <path d={`${d} L${pts[pts.length-1][0]},${zY} L0,${zY} Z`} fill="url(#eg)"/>
      <path d={d} fill="none" stroke={c} strokeWidth={2.5} strokeLinejoin="round"/>
    </svg>
  );
}
function Donut({score,T,size=80}) {
  const r=32,ci=2*Math.PI*r,fill=(score/100)*ci;
  const c=score>=80?T.green:score>=60?T.gold:T.red;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={r} fill="none" stroke={T.border} strokeWidth={8}/>
      <circle cx={40} cy={40} r={r} fill="none" stroke={c} strokeWidth={8} strokeDasharray={`${fill} ${ci}`} strokeDashoffset={ci/4} strokeLinecap="round"/>
      <text x={40} y={40} textAnchor="middle" dominantBaseline="central" fill={c} fontSize={16} fontFamily="Space Grotesk" fontWeight={700}>{score}</text>
    </svg>
  );
}
function Bar({value,max,color,T}) {
  const pct=Math.min(Math.abs(value)/(max||1),1)*100;
  return <div style={{height:4,background:T.border,borderRadius:2,width:"100%"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2}}/></div>;
}

// ── UI primitives ─────────────────────────────────────────────────────────────
function Card({children,style={},onClick,T}) {
  return <div onClick={onClick} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,boxShadow:T.shadow,...style}}>{children}</div>;
}
function Badge({label,color}) {
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"JetBrains Mono",letterSpacing:0.5}}>{label}</span>;
}
function Btn({children,onClick,variant="primary",small,style={},T}) {
  const base={padding:small?"6px 14px":"10px 20px",borderRadius:8,fontSize:small?12:14,fontWeight:600,transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",border:"none"};
  const vars={
    primary:{background:T.cyan,color:T.bg},
    ghost:{background:"transparent",color:T.cyan,border:`1px solid ${T.border}`},
    danger:{background:T.red+"22",color:T.red,border:`1px solid ${T.red}44`},
    soft:{background:T.surface,color:T.text,border:`1px solid ${T.border}`},
  };
  return <button onClick={onClick} style={{...base,...vars[variant],...style}} onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}
function Modal({open,onClose,title,children,width=560,T}) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000A",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontSize:17,fontWeight:700,fontFamily:"Space Grotesk"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",color:T.muted,fontSize:24,lineHeight:1,border:"none",cursor:"pointer"}}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({label,children,T}) {
  return <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}><label style={{fontSize:12,color:T.muted,display:"block"}}>{label}</label>{children}</div>;
}
function TInput({T,style={},placeholder,value,onChange,type="text"}) {
  return <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontFamily:"Inter,sans-serif",fontSize:14,outline:"none",width:"100%",...style}}/>;
}
function TSelect({T,children,style={},value,onChange}) {
  return <select value={value} onChange={onChange} style={{background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontFamily:"Inter,sans-serif",fontSize:14,outline:"none",width:"100%",...style}}>{children}</select>;
}
function TTextarea({T,rows=3,placeholder,value,onChange}) {
  return <textarea rows={rows} placeholder={placeholder} value={value} onChange={onChange} style={{background:T.inputBg,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"8px 12px",fontFamily:"Inter,sans-serif",fontSize:14,outline:"none",width:"100%",resize:"vertical"}}/>;
}
function StatBox({label,value,sub,color,T}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <span style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{label}</span>
      <span style={{fontSize:21,fontWeight:700,color:color||T.text,fontFamily:"Space Grotesk"}}>{value}</span>
      {sub&&<span style={{fontSize:12,color:T.muted}}>{sub}</span>}
    </div>
  );
}
function Screenshot({label,value,onChange,T}) {
  const id="ss"+label.replace(/ /g,"_");
  const handleFile=async(e)=>{
    const f=e.target.files[0];
    if(!f) return;
    try { onChange(await fileToBase64(f)); } catch(_){}
  };
  return (
    <div>
      <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6}}>{label}</label>
      <input id={id} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
      {value ? (
        <div style={{position:"relative",borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`}}>
          <img src={value} alt={label} style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block"}}/>
          <button onClick={()=>onChange("")} style={{position:"absolute",top:6,right:6,width:26,height:26,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",fontSize:16,cursor:"pointer"}}>x</button>
        </div>
      ) : (
        <label htmlFor={id} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,height:100,borderRadius:10,border:`2px dashed ${T.border}`,cursor:"pointer",background:"transparent"}}>
          <span style={{fontSize:26}}>📷</span>
          <span style={{fontSize:11,color:T.muted,textAlign:"center"}}>{label}</span>
        </label>
      )}
    </div>
  );
}

// ── Account stats ─────────────────────────────────────────────────────────────
function calcStats(acc, trades) {
  const ts=trades.filter(t=>t.accId===acc.id);
  if(!ts.length) return {pnl:0,winRate:0,wins:0,losses:0,totalTrades:0,avgWin:0,avgLoss:0,profitFactor:0,maxDD:0,consistency:100,equity:[],rr:0,expectancy:0};
  const wins=ts.filter(t=>t.pnl>0),losses=ts.filter(t=>t.pnl<0);
  const totalPnl=ts.reduce((s,t)=>s+t.pnl,0);
  const avgWin=wins.length?wins.reduce((s,t)=>s+t.pnl,0)/wins.length:0;
  const avgLoss=losses.length?Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length):0;
  const gp=wins.reduce((s,t)=>s+t.pnl,0),gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const pf=gl?gp/gl:0;
  let run=0; const equity=[...ts].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{run+=t.pnl;return run;});
  let peak=0,maxDD=0; equity.forEach(v=>{peak=Math.max(peak,v);maxDD=Math.max(maxDD,peak-v);});
  let consistency=100;
  if(acc.consistencyRule&&acc.consistencyTarget){
    const bd={}; ts.forEach(t=>{bd[t.date]=(bd[t.date]||0)+t.pnl;});
    const best=Math.max(...Object.values(bd).filter(p=>p>0),0);
    if(totalPnl>0&&best>0) consistency=Math.max(0,Math.round(100-Math.max(0,(best/totalPnl*100)-acc.consistencyTarget)));
  }
  return {pnl:totalPnl,winRate:wins.length/ts.length*100,wins:wins.length,losses:losses.length,totalTrades:ts.length,avgWin,avgLoss,profitFactor:pf,maxDD,consistency,equity,rr:avgLoss?avgWin/avgLoss:0,expectancy:(wins.length/ts.length)*avgWin-(losses.length/ts.length)*avgLoss};
}

// ── Trade Table ───────────────────────────────────────────────────────────────
function TradeTable({trades,accounts,T,onJournal}) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:`1px solid ${T.border}`}}>
            {["Date","Account","Symbol","Side","Qty","Entry","Exit","P&L","Setup","Dur","Notes"].map(h=>(
              <th key={h} style={{padding:"8px 10px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:0.5,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map(t=>{
            const acc=accounts.find(a=>a.id===t.accId);
            return (
              <tr key={t.id} style={{borderBottom:`1px solid ${T.border}22`}} onMouseEnter={e=>e.currentTarget.style.background=T.surface} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",fontSize:12}}>{t.date}</td>
                <td style={{padding:"9px 10px"}}><span style={{color:acc?.color||T.muted,fontSize:12}}>{acc?.name||"—"}</span></td>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",fontWeight:600}}>{t.symbol}</td>
                <td style={{padding:"9px 10px"}}><Badge label={t.side} color={t.side==="LONG"?T.green:T.red}/></td>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono"}}>{t.qty}</td>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono"}}>{t.entry}</td>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono"}}>{t.exit}</td>
                <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",color:clr(t.pnl,T),fontWeight:700}}>{fmtMoneyCur(t.pnl,acc?.currency)}</td>
                <td style={{padding:"9px 10px",fontSize:12}}>{t.setup}</td>
                <td style={{padding:"9px 10px",fontSize:12,color:T.muted}}>{t.duration}</td>
                <td style={{padding:"9px 10px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {t.emotion&&<span style={{fontSize:11,color:T.cyan}}>{EMOTIONS.find(e=>e.l===t.emotion)?.e} {t.emotion}</span>}
                    <button onClick={()=>onJournal&&onJournal(t)} style={{background:t.journal?T.cyan+"22":"transparent",color:t.journal?T.cyan:T.muted,border:`1px solid ${t.journal?T.cyan+"44":T.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                      {t.journal?"📝 View":"+ Add"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({accounts,trades,onAddTrade,onAddAccount,onJournal,T}) {
  const totalPnl=trades.reduce((s,t)=>s+t.pnl,0);
  const wins=trades.filter(t=>t.pnl>0).length;
  const wr=trades.length?(wins/trades.length*100).toFixed(1):0;
  let run=0;
  const allEq=[...trades].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{run+=t.pnl;return run;});
  const bd={}; trades.forEach(t=>{bd[t.date]=(bd[t.date]||0)+t.pnl;});
  const dv=Object.values(bd);
  const bestDay=Math.max(...dv,0),worstDay=Math.min(...dv,0);
  const currencies=[...new Set(accounts.map(a=>a.currency))];
  const sym=currencies.length===1?getCurrencySymbol(currencies[0]):"$";
  const fmt=n=>(n>=0?"+":"-")+sym+Math.abs(n).toFixed(2);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
        {[{label:"Net P&L",value:fmt(totalPnl),color:clr(totalPnl,T)},{label:"Total Trades",value:trades.length,color:T.text},{label:"Win Rate",value:`${wr}%`,color:T.cyan},{label:"Accounts",value:accounts.length,color:T.purple},{label:"Best Day",value:fmt(bestDay),color:T.green},{label:"Worst Day",value:fmt(worstDay),color:T.red}].map(s=>(
          <Card key={s.label} T={T} style={{padding:14,display:"flex",flexDirection:"column",gap:6}}>
            <span style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{s.label}</span>
            <span style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"Space Grotesk"}}>{s.value}</span>
          </Card>
        ))}
      </div>
      <Card T={T}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontWeight:700,fontSize:14,fontFamily:"Space Grotesk"}}>Combined Equity Curve</h3>
          <Badge label="ALL ACCOUNTS" color={T.cyan}/>
        </div>
        <EqCurve equity={allEq} T={T}/>
      </Card>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontWeight:700,fontSize:14,fontFamily:"Space Grotesk"}}>My Accounts</h3>
          <Btn onClick={onAddAccount} small T={T}>+ Link Account</Btn>
        </div>
        {accounts.length===0&&(
          <Card T={T} style={{textAlign:"center",padding:40,borderStyle:"dashed"}}>
            <div style={{fontSize:36,marginBottom:10}}>🏦</div>
            <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:15,marginBottom:6}}>No accounts linked yet</div>
            <div style={{color:T.muted,fontSize:13,marginBottom:16}}>Link your first trading account to start tracking.</div>
            <Btn onClick={onAddAccount} T={T}>+ Link Account</Btn>
          </Card>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:14}}>
          {accounts.map(acc=>{
            const s=calcStats(acc,trades);
            return (
              <Card key={acc.id} T={T} style={{borderLeft:`3px solid ${acc.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div><div style={{fontWeight:700,fontSize:14,fontFamily:"Space Grotesk"}}>{acc.name}</div><div style={{fontSize:12,color:T.muted,marginTop:3}}>{acc.broker}</div></div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}><Badge label={acc.type.toUpperCase()} color={acc.color}/>{acc.leverage&&<Badge label={`1:${acc.leverage}`} color={T.gold}/>}{acc.consistencyRule&&<Badge label="CONSISTENCY" color={T.purple}/>}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <StatBox label="P&L" value={fmtMoneyCur(s.pnl,acc.currency)} color={clr(s.pnl,T)} T={T}/>
                  <StatBox label="Win Rate" value={`${s.winRate.toFixed(1)}%`} color={T.cyan} T={T}/>
                  <StatBox label="Trades" value={s.totalTrades} T={T}/>
                  <StatBox label="Prof. Factor" value={s.profitFactor.toFixed(2)} color={T.gold} T={T}/>
                  {acc.leverage&&<StatBox label="Leverage" value={`1:${acc.leverage}`} color={T.gold} T={T}/>}
                  {acc.leverage&&acc.size&&<StatBox label="Buying Power" value={`${getCurrencySymbol(acc.currency)}${(acc.size*acc.leverage).toLocaleString()}`} color={T.purple} T={T}/>}
                </div>
                {acc.consistencyRule&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:`1px solid ${T.border}`}}>
                    <Donut score={s.consistency} T={T} size={52}/>
                    <div><div style={{fontSize:12,color:T.muted}}>Consistency Score</div><div style={{fontSize:12,marginTop:3}}>Max single-day: <span style={{color:T.gold}}>{acc.consistencyTarget}%</span></div></div>
                  </div>
                )}
                <Spark data={s.equity} w={230} h={34} color={acc.color}/>
              </Card>
            );
          })}
          <Card T={T} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,minHeight:160,borderStyle:"dashed",cursor:"pointer"}} onClick={onAddAccount}>
            <span style={{fontSize:30,color:T.muted}}>+</span>
            <span style={{color:T.muted,fontSize:13}}>Link New Account</span>
          </Card>
        </div>
      </div>
      <Card T={T}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{fontWeight:700,fontSize:14,fontFamily:"Space Grotesk"}}>Recent Trades</h3>
          <Btn onClick={onAddTrade} small T={T}>+ Log Trade</Btn>
        </div>
        {trades.length===0?(
          <div style={{textAlign:"center",padding:30,color:T.muted}}>
            <div style={{fontSize:28,marginBottom:6}}>📋</div>
            <div>No trades logged yet.</div>
          </div>
        ):(
          <TradeTable trades={[...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8)} accounts={accounts} T={T} onJournal={onJournal}/>
        )}
      </Card>
    </div>
  );
}

// ── P&L Calendar ──────────────────────────────────────────────────────────────
function PnLCalendar({trades,accounts,T}) {
  const now=new Date();
  const [selAcc,setSelAcc]=useState("all");
  const [month,setMonth]=useState({year:now.getFullYear(),month:now.getMonth()});
  const filtered=selAcc==="all"?trades:trades.filter(t=>t.accId===selAcc);
  const bd={}; filtered.forEach(t=>{if(!bd[t.date])bd[t.date]={pnl:0,trades:0};bd[t.date].pnl+=t.pnl;bd[t.date].trades+=1;});
  const {year,month:mo}=month;
  const first=new Date(year,mo,1).getDay();
  const dim=new Date(year,mo+1,0).getDate();
  const mName=new Date(year,mo).toLocaleString("default",{month:"long"});
  const cells=[...Array(first).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  const maxAbs=Math.max(...Object.values(bd).map(v=>Math.abs(v.pnl)),1);
  const cur=accounts.find(a=>a.id===selAcc)?.currency;
  const mStr=`${year}-${String(mo+1).padStart(2,"0")}`;
  const mTrades=filtered.filter(t=>t.date.startsWith(mStr));
  const mPnl=mTrades.reduce((s,t)=>s+t.pnl,0);
  const mWins=mTrades.filter(t=>t.pnl>0).length;
  const greenDays=Object.values(bd).filter(d=>d.pnl>0).length;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <TSelect T={T} style={{width:190}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
          <option value="all">All Accounts</option>
          {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </TSelect>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Btn small variant="ghost" T={T} onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month-1);return{year:d.getFullYear(),month:d.getMonth()};})}>&#8249;</Btn>
          <span style={{fontWeight:700,minWidth:130,textAlign:"center",fontFamily:"Space Grotesk"}}>{mName} {year}</span>
          <Btn small variant="ghost" T={T} onClick={()=>setMonth(m=>{const d=new Date(m.year,m.month+1);return{year:d.getFullYear(),month:d.getMonth()};})}>&#8250;</Btn>
        </div>
      </div>
      <Card T={T}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:T.muted,padding:"3px 0",fontWeight:600}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {cells.map((day,idx)=>{
            if(!day) return <div key={`e${idx}`}/>;
            const ds=`${year}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const info=bd[ds];
            const intensity=info?Math.min(Math.abs(info.pnl)/maxAbs,1):0;
            const bg=info?(info.pnl>=0?`rgba(6,214,160,${0.08+intensity*0.45})`:`rgba(239,68,68,${0.08+intensity*0.45})`):T.surface;
            return (
              <div key={day} style={{background:bg,borderRadius:7,padding:"6px 3px",textAlign:"center",minHeight:55,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:10,color:T.muted}}>{day}</span>
                {info&&<><span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:clr(info.pnl,T)}}>{fmtMoneyCur(info.pnl,cur)}</span><span style={{fontSize:9,color:T.muted}}>{info.trades}t</span></>}
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
        {[{label:"Month P&L",value:fmtMoneyCur(mPnl,cur),color:clr(mPnl,T)},{label:"Trades",value:mTrades.length},{label:"Win Rate",value:mTrades.length?`${(mWins/mTrades.length*100).toFixed(0)}%`:"—",color:T.cyan},{label:"Green Days",value:greenDays,color:T.green}].map(s=>(
          <Card key={s.label} T={T} style={{padding:12}}><div style={{fontSize:10,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div><div style={{fontSize:19,fontWeight:700,color:s.color||T.text,fontFamily:"Space Grotesk"}}>{s.value}</div></Card>
        ))}
      </div>
    </div>
  );
}

// ── Trade Journal page ────────────────────────────────────────────────────────
function JournalPage({trades,accounts,T,onJournal}) {
  const [selAcc,setSelAcc]=useState("all");
  const [grade,setGrade]=useState("all");
  const [search,setSearch]=useState("");
  const journalled=trades.filter(t=>t.journal||t.rationale||t.emotion||t.grade||t.mistakes);
  const filtered=journalled
    .filter(t=>selAcc==="all"||t.accId===selAcc)
    .filter(t=>grade==="all"||t.grade===grade)
    .filter(t=>!search||t.symbol.toLowerCase().includes(search.toLowerCase())||(t.journal||"").toLowerCase().includes(search.toLowerCase()));
  const sorted=[...filtered].sort((a,b)=>b.date.localeCompare(a.date));
  const GC={"A+":T.green,A:T.green,B:T.cyan,C:T.gold,D:T.red,F:T.red};
  const pct=trades.length?Math.round(journalled.length/trades.length*100):0;
  const pending=trades.filter(t=>(selAcc==="all"||t.accId===selAcc)&&!t.journal&&!t.rationale&&!t.emotion&&!t.grade&&!t.mistakes);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <Card T={T} style={{padding:16,background:`linear-gradient(135deg,${T.cyan}11,${T.purple}11)`,border:`1px solid ${T.cyan}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div><div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:14,marginBottom:3}}>Trade Journal</div><div style={{fontSize:12,color:T.muted}}>Document every trade to build lasting edge awareness.</div></div>
          <div style={{display:"flex",gap:18}}>
            {[{v:journalled.length,l:"Journalled",c:T.cyan},{v:`${pct}%`,l:"Coverage",c:pct>=70?T.green:pct>=40?T.gold:T.red},{v:trades.length-journalled.length,l:"Pending",c:T.purple}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:18,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted}}>{s.l}</div></div>
            ))}
          </div>
        </div>
        <div style={{marginTop:10,height:4,background:T.border,borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.cyan},${T.purple})`,borderRadius:2}}/></div>
      </Card>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <TSelect T={T} style={{width:170}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
          <option value="all">All Accounts</option>
          {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </TSelect>
        <TSelect T={T} style={{width:120}} value={grade} onChange={e=>setGrade(e.target.value)}>
          <option value="all">All Grades</option>
          {["A+","A","B","C","D","F"].map(g=><option key={g} value={g}>Grade {g}</option>)}
        </TSelect>
        <TInput T={T} style={{width:160}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {pending.length>0&&(
        <Card T={T}>
          <div style={{fontFamily:"Space Grotesk",fontWeight:700,marginBottom:10,fontSize:13}}>Awaiting Journal Entry</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {pending.slice(0,5).map(t=>{
              const acc=accounts.find(a=>a.id===t.accId);
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontWeight:700}}>{t.symbol}</span>
                    <Badge label={t.side} color={t.side==="LONG"?T.green:T.red}/>
                    <span style={{fontSize:11,color:T.muted}}>{t.date}</span>
                    <span style={{fontSize:11,color:acc?.color}}>{acc?.name}</span>
                    <span style={{fontFamily:"JetBrains Mono",color:clr(t.pnl,T),fontWeight:600,fontSize:12}}>{fmtMoneyCur(t.pnl,acc?.currency)}</span>
                  </div>
                  <Btn small variant="ghost" onClick={()=>onJournal(t)} T={T}>+ Journal</Btn>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {sorted.length>0?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:13}}>Journal Entries ({sorted.length})</div>
          {sorted.map(t=>{
            const acc=accounts.find(a=>a.id===t.accId);
            const gc=GC[t.grade]||T.muted;
            return(
              <Card key={t.id} T={T} style={{borderLeft:`3px solid ${gc}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14}}>{t.symbol}</span>
                    <Badge label={t.side} color={t.side==="LONG"?T.green:T.red}/>
                    {t.grade&&<span style={{background:gc+"22",color:gc,border:`1px solid ${gc}44`,borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>Grade {t.grade}</span>}
                    {t.emotion&&<span style={{fontSize:12,color:T.muted}}>{EMOTIONS.find(e=>e.l===t.emotion)?.e} {t.emotion}</span>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14,color:clr(t.pnl,T)}}>{fmtMoneyCur(t.pnl,acc?.currency)}</span>
                    <Btn small variant="soft" onClick={()=>onJournal(t)} T={T}>Edit</Btn>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.muted,marginBottom:8,display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span>{t.date}</span><span style={{color:acc?.color}}>{acc?.name}</span>{t.setup&&<span>{t.setup}</span>}{t.duration&&<span>{t.duration}</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8}}>
                  {t.rationale&&<div style={{background:T.surface,borderRadius:7,padding:9}}><div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Rationale</div><div style={{fontSize:12,lineHeight:1.6}}>{t.rationale}</div></div>}
                  {t.execution&&<div style={{background:T.surface,borderRadius:7,padding:9}}><div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Execution</div><div style={{fontSize:12,lineHeight:1.6}}>{t.execution}</div></div>}
                  {t.lessons&&<div style={{background:T.surface,borderRadius:7,padding:9}}><div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Lessons</div><div style={{fontSize:12,lineHeight:1.6}}>{t.lessons}</div></div>}
                  {t.preMarket&&<div style={{background:T.surface,borderRadius:7,padding:9}}><div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Pre-Market</div><div style={{fontSize:12,lineHeight:1.6}}>{t.preMarket}</div></div>}
                </div>
                {t.mistakes&&<div style={{marginTop:8,padding:9,background:T.red+"0A",border:`1px solid ${T.red}22`,borderRadius:7}}><div style={{fontSize:10,color:T.red,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Mistakes</div><div style={{fontSize:12,lineHeight:1.6}}>{t.mistakes}</div></div>}
                {t.journal&&<div style={{marginTop:8,padding:9,background:T.surface,borderRadius:7,borderLeft:`3px solid ${T.cyan}44`}}><div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Full Entry</div><div style={{fontSize:12,lineHeight:1.7}}>{t.journal}</div></div>}
                {(t.screenshotBefore||t.screenshotAfter)&&(
                  <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {t.screenshotBefore&&<div><div style={{fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Before</div><img src={t.screenshotBefore} alt="Before" style={{width:"100%",borderRadius:7,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>window.open(t.screenshotBefore,"_blank")}/></div>}
                    {t.screenshotAfter&&<div><div style={{fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>After</div><img src={t.screenshotAfter} alt="After" style={{width:"100%",borderRadius:7,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>window.open(t.screenshotAfter,"_blank")}/></div>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ):(
        <Card T={T} style={{textAlign:"center",padding:40,borderStyle:"dashed"}}>
          <div style={{fontSize:34,marginBottom:8}}>📓</div>
          <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:14,marginBottom:5}}>No journal entries yet</div>
          <div style={{color:T.muted,fontSize:12}}>Log a trade and fill in the journal fields to see entries here.</div>
        </Card>
      )}
    </div>
  );
}

// ── Trade Log ─────────────────────────────────────────────────────────────────
function TradeLog({trades,accounts,onAddTrade,T,onJournal}) {
  const [selAcc,setSelAcc]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=(selAcc==="all"?trades:trades.filter(t=>t.accId===selAcc))
    .filter(t=>!search||t.symbol.toLowerCase().includes(search.toLowerCase())||t.setup?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <TSelect T={T} style={{width:200}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
          <option value="all">All Accounts</option>
          {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </TSelect>
        <TInput T={T} style={{width:190}} placeholder="Search symbol / setup..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <Btn onClick={onAddTrade} small T={T}>+ Log Trade</Btn>
      </div>
      <Card T={T}>
        <TradeTable trades={[...filtered].sort((a,b)=>b.date.localeCompare(a.date))} accounts={accounts} T={T} onJournal={onJournal}/>
        {filtered.length===0&&<div style={{textAlign:"center",padding:30,color:T.muted}}>No trades found.</div>}
      </Card>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function Reports({trades,accounts,T}) {
  const [selAcc,setSelAcc]=useState("all");
  const f=selAcc==="all"?trades:trades.filter(t=>t.accId===selAcc);
  const wins=f.filter(t=>t.pnl>0),losses=f.filter(t=>t.pnl<0);
  const totalPnl=f.reduce((s,t)=>s+t.pnl,0);
  const gp=wins.reduce((s,t)=>s+t.pnl,0),gl=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const avgWin=wins.length?gp/wins.length:0,avgLoss=losses.length?gl/losses.length:0;
  const pf=gl?gp/gl:0,wr=f.length?wins.length/f.length*100:0;
  const rr=avgLoss?avgWin/avgLoss:0,exp=f.length?(wr/100*avgWin-(1-wr/100)*avgLoss):0;
  let run=0,peak=0,maxDD=0;
  [...f].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>{run+=t.pnl;peak=Math.max(peak,run);maxDD=Math.max(maxDD,peak-run);});
  const bS={},bSym={},bE={};
  f.forEach(t=>{
    if(!bS[t.setup])bS[t.setup]={pnl:0,trades:0,wins:0};
    bS[t.setup].pnl+=t.pnl;bS[t.setup].trades+=1;if(t.pnl>0)bS[t.setup].wins+=1;
    if(!bSym[t.symbol])bSym[t.symbol]={pnl:0,trades:0,wins:0};
    bSym[t.symbol].pnl+=t.pnl;bSym[t.symbol].trades+=1;if(t.pnl>0)bSym[t.symbol].wins+=1;
    if(t.emotion){if(!bE[t.emotion])bE[t.emotion]={pnl:0,trades:0,wins:0};bE[t.emotion].pnl+=t.pnl;bE[t.emotion].trades+=1;if(t.pnl>0)bE[t.emotion].wins+=1;}
  });
  const cur=selAcc!=="all"?accounts.find(a=>a.id===selAcc)?.currency:undefined;
  const cs=getCurrencySymbol(cur);
  const fm=v=>fmtMoneyCur(v,cur);
  const smx=Math.max(...Object.values(bS).map(d=>Math.abs(d.pnl)),1);
  const ymx=Math.max(...Object.values(bSym).map(d=>Math.abs(d.pnl)),1);
  const emx=Math.max(...Object.values(bE).map(d=>Math.abs(d.pnl)),1);
  const stats=[
    {l:"Total P&L",v:fm(totalPnl),c:clr(totalPnl,T)},{l:"Gross Profit",v:fm(gp),c:T.green},
    {l:"Gross Loss",v:`-${cs}${gl.toFixed(2)}`,c:T.red},{l:"Profit Factor",v:pf.toFixed(2),c:pf>=1.5?T.green:T.gold},
    {l:"Win Rate",v:`${wr.toFixed(1)}%`,c:T.cyan},{l:"R:R Ratio",v:rr.toFixed(2),c:T.gold},
    {l:"Avg Win",v:fm(avgWin),c:T.green},{l:"Avg Loss",v:`-${cs}${avgLoss.toFixed(2)}`,c:T.red},
    {l:"Expectancy",v:fm(exp),c:clr(exp,T)},{l:"Max Drawdown",v:`-${cs}${maxDD.toFixed(2)}`,c:T.red},
    {l:"Total Trades",v:f.length},{l:"Winning",v:wins.length,c:T.green},
    {l:"Losing",v:losses.length,c:T.red},{l:"Consec. Wins",v:maxConsec(f,true)},
    {l:"Consec. Losses",v:maxConsec(f,false)},{l:"Largest Win",v:fm(Math.max(...f.map(t=>t.pnl),0)),c:T.green},
  ];
  const BkdRow=({k,d,max,isEmo})=>(
    <div style={{display:"grid",gridTemplateColumns:"110px 1fr 80px 55px 65px",gap:8,alignItems:"center"}}>
      <span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isEmo?`${EMOTIONS.find(e=>e.l===k)?.e} ${k}`:k}</span>
      <Bar value={d.pnl} max={max} color={clr(d.pnl,T)} T={T}/>
      <span style={{fontFamily:"JetBrains Mono",color:clr(d.pnl,T),fontSize:12,fontWeight:600}}>{fm(d.pnl)}</span>
      <span style={{fontSize:11,color:T.muted}}>{d.trades}t</span>
      <span style={{fontSize:11,color:T.cyan}}>{(d.wins/d.trades*100).toFixed(0)}% WR</span>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <TSelect T={T} style={{width:210}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
        <option value="all">All Accounts</option>
        {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </TSelect>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:10}}>
        {stats.map(s=>(
          <Card key={s.l} T={T} style={{padding:13}}>
            <div style={{fontSize:10,color:T.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.c||T.text,fontFamily:"Space Grotesk"}}>{s.v}</div>
          </Card>
        ))}
      </div>
      {Object.keys(bS).length>0&&<Card T={T}><h3 style={{fontWeight:700,marginBottom:12,fontFamily:"Space Grotesk",fontSize:13}}>By Setup</h3><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(bS).map(([k,d])=><BkdRow key={k} k={k} d={d} max={smx}/>)}</div></Card>}
      {Object.keys(bSym).length>0&&<Card T={T}><h3 style={{fontWeight:700,marginBottom:12,fontFamily:"Space Grotesk",fontSize:13}}>By Symbol</h3><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(bSym).map(([k,d])=><BkdRow key={k} k={k} d={d} max={ymx}/>)}</div></Card>}
      {Object.keys(bE).length>0&&<Card T={T}><h3 style={{fontWeight:700,marginBottom:12,fontFamily:"Space Grotesk",fontSize:13}}>By Emotional State</h3><div style={{display:"flex",flexDirection:"column",gap:8}}>{Object.entries(bE).sort((a,b)=>b[1].pnl-a[1].pnl).map(([k,d])=><BkdRow key={k} k={k} d={d} max={emx} isEmo/>)}</div><div style={{marginTop:10,padding:"8px 12px",background:T.surface,borderRadius:7,fontSize:11,color:T.muted}}>Use this to identify which emotional states lead to your best and worst results.</div></Card>}
    </div>
  );
}

// ── Track Record ──────────────────────────────────────────────────────────────
function TrackRecord({trades,accounts,T}) {
  const [selAcc,setSelAcc]=useState("all");
  const f=selAcc==="all"?trades:trades.filter(t=>t.accId===selAcc);
  let run=0;
  const equity=[...f].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{run+=t.pnl;return run;});
  const wr=f.length?f.filter(t=>t.pnl>0).length/f.length*100:0;
  const bM={};
  f.forEach(t=>{const m=t.date.slice(0,7);if(!bM[m])bM[m]={pnl:0,trades:0,wins:0};bM[m].pnl+=t.pnl;bM[m].trades+=1;if(t.pnl>0)bM[m].wins+=1;});
  const cur=selAcc!=="all"?accounts.find(a=>a.id===selAcc)?.currency:undefined;
  const fm=v=>fmtMoneyCur(v,cur);
  const last=equity[equity.length-1]||0;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <TSelect T={T} style={{width:210}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
        <option value="all">All Accounts</option>
        {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </TSelect>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
        {[{l:"Total Return",v:fm(last),c:clr(last,T)},{l:"Win Rate",v:`${wr.toFixed(1)}%`,c:T.cyan},{l:"Sample Size",v:`${f.length} trades`},{l:"Profitable Months",v:`${Object.values(bM).filter(m=>m.pnl>0).length}/${Object.keys(bM).length}`,c:T.green}].map(s=>(
          <Card key={s.l} T={T} style={{padding:14}}><div style={{fontSize:10,color:T.muted,marginBottom:6,textTransform:"uppercase"}}>{s.l}</div><div style={{fontSize:20,fontWeight:700,color:s.c||T.text,fontFamily:"Space Grotesk"}}>{s.v}</div></Card>
        ))}
      </div>
      <Card T={T}><h3 style={{fontWeight:700,marginBottom:14,fontFamily:"Space Grotesk",fontSize:13}}>Verified Equity Curve</h3><EqCurve equity={equity} height={180} T={T}/></Card>
      <Card T={T}>
        <h3 style={{fontWeight:700,marginBottom:12,fontFamily:"Space Grotesk",fontSize:13}}>Monthly Breakdown</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Month","P&L","Trades","Win Rate","Avg/Trade"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",color:T.muted,fontSize:10,textTransform:"uppercase",letterSpacing:0.5}}>{h}</th>)}</tr></thead>
          <tbody>{Object.entries(bM).sort().map(([m,d])=>(
            <tr key={m} style={{borderBottom:`1px solid ${T.border}22`}}>
              <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",fontSize:11}}>{m}</td>
              <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",color:clr(d.pnl,T),fontWeight:700}}>{fm(d.pnl)}</td>
              <td style={{padding:"9px 10px"}}>{d.trades}</td>
              <td style={{padding:"9px 10px",color:T.cyan}}>{(d.wins/d.trades*100).toFixed(0)}%</td>
              <td style={{padding:"9px 10px",fontFamily:"JetBrains Mono",color:clr(d.pnl/d.trades,T)}}>{fm(d.pnl/d.trades)}</td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Consistency ───────────────────────────────────────────────────────────────
function Consistency({accounts,trades,T}) {
  const prop=accounts.filter(a=>a.consistencyRule);
  if(!prop.length) return (
    <Card T={T} style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:34,marginBottom:10}}>📊</div>
      <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:14,marginBottom:5}}>No consistency rules set</div>
      <div style={{color:T.muted,fontSize:12}}>Enable consistency tracking when linking a prop firm account.</div>
    </Card>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {prop.map(acc=>{
        const ts=trades.filter(t=>t.accId===acc.id);
        const totalPnl=ts.reduce((s,t)=>s+t.pnl,0);
        const bd={}; ts.forEach(t=>{bd[t.date]=(bd[t.date]||0)+t.pnl;});
        const posDays=Object.entries(bd).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
        const bestPnl=posDays[0]?.[1]||0;
        const bestPct=totalPnl>0?bestPnl/totalPnl*100:0;
        const lim=acc.consistencyTarget;
        const pass=bestPct<=lim;
        const s=calcStats(acc,trades);
        return (
          <Card key={acc.id} T={T} style={{borderLeft:`3px solid ${acc.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div><h3 style={{fontWeight:700,fontSize:15,fontFamily:"Space Grotesk"}}>{acc.name}</h3><div style={{fontSize:12,color:T.muted,marginTop:3}}>No single day over {lim}% of total P&L</div></div>
              <div style={{display:"flex",alignItems:"center",gap:12}}><Donut score={s.consistency} T={T} size={64}/><div><div style={{fontSize:12,color:T.muted,marginBottom:4}}>Consistency Score</div><Badge label={pass?"PASSING":"FAILING"} color={pass?T.green:T.red}/></div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
              <StatBox label="Total P&L" value={fmtMoneyCur(totalPnl,acc.currency)} color={clr(totalPnl,T)} T={T}/>
              <StatBox label="Best Day" value={fmtMoneyCur(bestPnl,acc.currency)} color={T.gold} T={T}/>
              <StatBox label="Best Day %" value={`${bestPct.toFixed(1)}%`} color={bestPct>lim?T.red:T.green} sub={`Limit: ${lim}%`} T={T}/>
              <StatBox label="Green Days" value={posDays.length} color={T.green} T={T}/>
            </div>
            {posDays.map(([date,pnl])=>{
              const pct=totalPnl>0?pnl/totalPnl*100:0;
              const over=pct>lim;
              return (
                <div key={date} style={{display:"grid",gridTemplateColumns:"95px 1fr 65px 60px",gap:10,alignItems:"center",marginBottom:7}}>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11}}>{date}</span>
                  <div style={{position:"relative",height:7,background:T.border,borderRadius:3}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.min(pct,100)}%`,background:over?T.red:T.green,borderRadius:3}}/>
                    <div style={{position:"absolute",left:`${lim}%`,top:-3,bottom:-3,width:2,background:T.gold}}/>
                  </div>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:clr(pnl,T)}}>{fmtMoneyCur(pnl,acc.currency)}</span>
                  <span style={{fontSize:11,color:over?T.red:T.green}}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}

// ── Trade Reviews ─────────────────────────────────────────────────────────────
function Videos({trades,accounts,onUpdateTrade,T}) {
  const [selAcc,setSelAcc]=useState("all");
  const [modal,setModal]=useState(null);
  const [url,setUrl]=useState("");
  const filtered=selAcc==="all"?trades:trades.filter(t=>t.accId===selAcc);
  const withV=filtered.filter(t=>t.video),noV=filtered.filter(t=>!t.video);
  const getEmbed=(u)=>{const m=u.match(/(?:v=|youtu\.be\/)([^&?]+)/);return m?`https://www.youtube.com/embed/${m[1]}`:null;};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <TSelect T={T} style={{width:200}} value={selAcc} onChange={e=>setSelAcc(e.target.value)}>
          <option value="all">All Accounts</option>
          {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </TSelect>
        <span style={{fontSize:12,color:T.muted}}>{withV.length} uploaded · {noV.length} pending</span>
      </div>
      {withV.length>0&&(
        <div>
          <h3 style={{fontWeight:700,marginBottom:12,fontFamily:"Space Grotesk",fontSize:13}}>Trade Reviews</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
            {withV.map(t=>{
              const acc=accounts.find(a=>a.id===t.accId);
              const embed=t.video&&(t.video.includes("youtube")||t.video.includes("youtu.be"))?getEmbed(t.video):null;
              return (
                <Card key={t.id} T={T}>
                  {embed?<iframe src={embed} width="100%" height="170" frameBorder="0" allowFullScreen style={{borderRadius:7,marginBottom:10}}/>:
                    <div style={{background:T.surface,height:170,borderRadius:7,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <span style={{fontSize:22}}>🎬</span><a href={t.video} target="_blank" rel="noreferrer" style={{color:T.cyan,fontSize:13}}>Watch Video</a>
                    </div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontFamily:"JetBrains Mono",fontWeight:700}}>{t.symbol} {t.side}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>{t.date} · {acc?.name}</div></div>
                    <div style={{fontFamily:"JetBrains Mono",color:clr(t.pnl,T),fontWeight:700}}>{fmtMoneyCur(t.pnl,acc?.currency)}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <h3 style={{fontWeight:700,marginBottom:10,fontFamily:"Space Grotesk",fontSize:13}}>Add Review to Trade</h3>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {noV.slice(0,10).map(t=>{
            const acc=accounts.find(a=>a.id===t.accId);
            return (
              <Card key={t.id} T={T} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px"}}>
                <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontFamily:"JetBrains Mono",fontWeight:700,minWidth:70}}>{t.symbol}</span>
                  <span style={{fontSize:11,color:T.muted}}>{t.date}</span>
                  <span style={{fontSize:11,color:acc?.color}}>{acc?.name}</span>
                  <span style={{fontFamily:"JetBrains Mono",color:clr(t.pnl,T),fontWeight:600,fontSize:12}}>{fmtMoneyCur(t.pnl,acc?.currency)}</span>
                </div>
                <Btn small variant="ghost" T={T} onClick={()=>{setModal(t.id);setUrl("");}}>+ Add Video</Btn>
              </Card>
            );
          })}
        </div>
      </div>
      <Modal open={!!modal} onClose={()=>setModal(null)} title="Add Trade Review Video" T={T}>
        <Field label="Video URL (YouTube, Loom, Vimeo, or direct link)" T={T}>
          <TInput T={T} placeholder="https://youtube.com/watch?v=..." value={url} onChange={e=>setUrl(e.target.value)}/>
        </Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="ghost" onClick={()=>setModal(null)} T={T}>Cancel</Btn>
          <Btn T={T} onClick={()=>{if(modal&&url){onUpdateTrade(modal,{video:url});setModal(null);setUrl("");}}} >Save Video</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── Journal Modal ─────────────────────────────────────────────────────────────
function JournalModal({trade,accounts,open,onClose,onSave,T}) {
  const [j,setJ]=useState({preMarket:"",rationale:"",execution:"",lessons:"",grade:"",journal:""});
  useEffect(()=>{
    if(trade) setJ({preMarket:trade.preMarket||"",rationale:trade.rationale||"",execution:trade.execution||"",lessons:trade.lessons||"",grade:trade.grade||"",journal:trade.journal||""});
  },[trade?.id]);
  const acc=accounts.find(a=>a.id===trade?.accId);
  const GC={"A+":T.green,A:T.green,B:T.cyan,C:T.gold,D:T.red,F:T.red};
  if(!trade) return null;
  return (
    <Modal open={open} onClose={onClose} title="Trade Journal" width={660} T={T}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 14px",marginBottom:16,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontFamily:"JetBrains Mono",fontWeight:700}}>{trade.symbol}</span>
        <Badge label={trade.side} color={trade.side==="LONG"?T.green:T.red}/>
        <span style={{fontSize:12,color:T.muted}}>{trade.date}</span>
        <span style={{fontSize:12,color:acc?.color}}>{acc?.name}</span>
        <span style={{fontFamily:"JetBrains Mono",fontWeight:700,color:clr(trade.pnl,T)}}>{fmtMoneyCur(trade.pnl,acc?.currency)}</span>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,color:T.muted,display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:0.5}}>Trade Grade</label>
        <div style={{display:"flex",gap:7}}>
          {["A+","A","B","C","D","F"].map(g=>{
            const gc=GC[g]||T.cyan;
            return <button key={g} onClick={()=>setJ(j=>({...j,grade:j.grade===g?"":g}))} style={{width:40,height:40,borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",background:j.grade===g?gc:"transparent",color:j.grade===g?T.bg:T.muted,border:`2px solid ${j.grade===g?gc:T.border}`}}>{g}</button>;
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Field label="Pre-Market Bias" T={T}><TTextarea T={T} rows={3} placeholder="Market read before session..." value={j.preMarket} onChange={e=>setJ(j=>({...j,preMarket:e.target.value}))}/></Field>
        <Field label="Trade Rationale" T={T}><TTextarea T={T} rows={3} placeholder="Why did you take this trade?" value={j.rationale} onChange={e=>setJ(j=>({...j,rationale:e.target.value}))}/></Field>
        <Field label="Execution Notes" T={T}><TTextarea T={T} rows={3} placeholder="Entry/exit quality..." value={j.execution} onChange={e=>setJ(j=>({...j,execution:e.target.value}))}/></Field>
        <Field label="Lessons Learned" T={T}><TTextarea T={T} rows={3} placeholder="What did this teach you?" value={j.lessons} onChange={e=>setJ(j=>({...j,lessons:e.target.value}))}/></Field>
      </div>
      <Field label="Full Journal Entry" T={T}><TTextarea T={T} rows={4} placeholder="Thoughts, observations, mindset notes..." value={j.journal} onChange={e=>setJ(j=>({...j,journal:e.target.value}))}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="ghost" onClick={onClose} T={T}>Cancel</Btn>
        <Btn onClick={()=>{onSave(trade.id,j);onClose();}} T={T}>Save Journal</Btn>
      </div>
    </Modal>
  );
}

// ── Add Trade Modal ───────────────────────────────────────────────────────────
function AddTradeModal({open,onClose,accounts,onSave,T}) {
  const blank={accId:accounts[0]?.id||"",date:new Date().toISOString().slice(0,10),symbol:"",side:"LONG",qty:1,entry:"",exit:"",pnl:"",commission:"",commType:"per_side",duration:"",setup:"",note:"",contractSize:"",emotion:"",mistakes:"",screenshotBefore:"",screenshotAfter:""};
  const [form,setForm]=useState(blank);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{ if(!open) setForm(f=>({...blank,accId:f.accId})); },[open]);

  const acc=accounts.find(a=>a.id===form.accId);
  const isCFD=acc?.type==="cfd";
  const cur=acc?.currency;
  const cs=getCurrencySymbol(cur);

  const handleSym=(val)=>{
    const s=val.toUpperCase();
    set("symbol",s);
    if(isCFD){const d=CFD_SIZES[s];if(d) set("contractSize",String(d));}
  };
  const handleAcc=(val)=>{
    set("accId",val);
    const na=accounts.find(a=>a.id===val);
    if(na?.type==="cfd"&&form.symbol){const d=CFD_SIZES[form.symbol.toUpperCase()];if(d) set("contractSize",String(d));}
  };

  const rawPnl=parseFloat(form.pnl)||0;
  const commAmt=parseFloat(form.commission)||0;
  const totalComm=form.commType==="per_side"?commAmt*2:commAmt;
  const netPnl=rawPnl-totalComm;
  const hasPnl=form.pnl!=="";
  const cSize=parseFloat(form.contractSize)||0;
  const qty=parseFloat(form.qty)||0;
  const entry=parseFloat(form.entry)||0;
  const exit=parseFloat(form.exit)||0;
  const canAuto=isCFD&&cSize>0&&qty>0&&entry>0&&exit>0;
  const autoPnl=canAuto?(form.side==="LONG"?(exit-entry):(entry-exit))*qty*cSize:null;

  const handleSave=()=>{
    if(!form.accId||!form.symbol||!form.entry||!form.exit) return;
    const gross=hasPnl?rawPnl:(autoPnl??0);
    const net=gross-totalComm;
    onSave({...form,id:uid(),qty,entry,exit,contractSize:cSize||null,pnl:net,grossPnl:gross,commission:totalComm,video:null,journal:""});
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log New Trade" width={660} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Field label="Account" T={T}><TSelect T={T} value={form.accId} onChange={e=>handleAcc(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</TSelect></Field>
        <Field label="Date" T={T}><TInput T={T} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></Field>
        <Field label="Symbol" T={T}><TInput T={T} placeholder="EURUSD, XAUUSD, NQ..." value={form.symbol} onChange={e=>handleSym(e.target.value)}/></Field>
        <Field label="Side" T={T}><TSelect T={T} value={form.side} onChange={e=>set("side",e.target.value)}><option>LONG</option><option>SHORT</option></TSelect></Field>
        <Field label="Qty / Lots" T={T}><TInput T={T} type="number" value={form.qty} onChange={e=>set("qty",e.target.value)}/></Field>
        <Field label="Setup" T={T}><TInput T={T} placeholder="Breakout, Reversal, Trend..." value={form.setup} onChange={e=>set("setup",e.target.value)}/></Field>
        <Field label="Entry Price" T={T}><TInput T={T} type="number" value={form.entry} onChange={e=>set("entry",e.target.value)}/></Field>
        <Field label="Exit Price" T={T}><TInput T={T} type="number" value={form.exit} onChange={e=>set("exit",e.target.value)}/></Field>
        <Field label={`Gross P&L (${cs})${canAuto?" — optional":""}`} T={T}><TInput T={T} type="number" placeholder={canAuto?`Auto: ${fmtMoneyCur(autoPnl,cur)}`:"Enter manually"} value={form.pnl} onChange={e=>set("pnl",e.target.value)}/></Field>
        <Field label="Duration" T={T}><TInput T={T} placeholder="30m, 2h..." value={form.duration} onChange={e=>set("duration",e.target.value)}/></Field>
      </div>

      {isCFD&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:9}}>📐 Contract Size</div>
          <Field label="Units per 1 lot (set by your broker)" T={T}><TInput T={T} type="number" placeholder="e.g. 100000 forex, 100 for XAUUSD" value={form.contractSize} onChange={e=>set("contractSize",e.target.value)}/></Field>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
            <span style={{color:T.text,fontWeight:600}}>Common: </span>
            Forex=100,000 · XAUUSD=100 · Indices=1 · Oil=1,000
          </div>
          {canAuto&&(
            <div style={{marginTop:10,padding:"8px 12px",background:clr(autoPnl,T)+"11",border:`1px solid ${clr(autoPnl,T)}33`,borderRadius:7,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Auto P&L</div><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:17,color:clr(autoPnl,T)}}>{fmtMoneyCur(autoPnl,cur)}</div></div>
              <div style={{fontSize:11,color:T.muted}}>{form.side==="LONG"?"(Exit-Entry)":"(Entry-Exit)"} x {qty} lots x {cSize.toLocaleString()}{hasPnl&&<span style={{color:T.gold}}> — manual overrides</span>}</div>
            </div>
          )}
        </div>
      )}

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:9}}>💸 Commission</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <Field label="Amount ($)" T={T}><TInput T={T} type="number" placeholder="e.g. 3.50" value={form.commission} onChange={e=>set("commission",e.target.value)}/></Field>
          <Field label="Charge type" T={T}><TSelect T={T} value={form.commType} onChange={e=>set("commType",e.target.value)}><option value="per_side">Per side (entry + exit)</option><option value="flat">Flat (total round trip)</option></TSelect></Field>
        </div>
        {commAmt>0&&<div style={{fontSize:12,color:T.muted}}>Total deducted: <span style={{color:T.red,fontFamily:"JetBrains Mono",fontWeight:600}}>-{cs}{totalComm.toFixed(2)}</span>{form.commType==="per_side"&&<span> ({cs}{commAmt.toFixed(2)} x2)</span>}</div>}
      </div>

      {hasPnl&&(
        <div style={{background:clr(netPnl,T)+"11",border:`1px solid ${clr(netPnl,T)}33`,borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Gross P&L</div><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14,color:clr(rawPnl,T)}}>{fmtMoneyCur(rawPnl,cur)}</div></div>
          {totalComm>0&&<><div style={{color:T.muted}}>-</div><div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Commission</div><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14,color:T.red}}>-{cs}{totalComm.toFixed(2)}</div></div><div style={{color:T.muted}}>=</div></>}
          <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Net P&L</div><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:18,color:clr(netPnl,T)}}>{fmtMoneyCur(netPnl,cur)}</div></div>
        </div>
      )}

      <Field label="Quick Note" T={T}><TTextarea T={T} rows={2} placeholder="Brief note about the trade..." value={form.note} onChange={e=>set("note",e.target.value)}/></Field>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>🧠 Emotional State{form.emotion&&<span style={{color:T.cyan,marginLeft:8,fontWeight:400,textTransform:"none"}}>{form.emotion}</span>}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {EMOTIONS.map(em=>(
            <button key={em.l} onClick={()=>set("emotion",form.emotion===em.l?"":em.l)} style={{padding:"6px 11px",borderRadius:18,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,background:form.emotion===em.l?T.cyan+"33":"transparent",color:form.emotion===em.l?T.cyan:T.muted,border:`1px solid ${form.emotion===em.l?T.cyan+"66":T.border}`,fontWeight:form.emotion===em.l?600:400}}>
              <span style={{fontSize:14}}>{em.e}</span>{em.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:9}}>⚠️ Mistakes Made<span style={{marginLeft:8,fontSize:10,fontWeight:400,textTransform:"none"}}>Leave blank if none</span></div>
        <TTextarea T={T} rows={3} placeholder="Describe exactly what you did wrong on this trade..." value={form.mistakes} onChange={e=>set("mistakes",e.target.value)}/>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>📸 Setup Screenshots</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Screenshot label="Before — Pre-trade setup" value={form.screenshotBefore} onChange={v=>set("screenshotBefore",v)} T={T}/>
          <Screenshot label="After — Post-trade result" value={form.screenshotAfter} onChange={v=>set("screenshotAfter",v)} T={T}/>
        </div>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="ghost" onClick={onClose} T={T}>Cancel</Btn>
        <Btn onClick={handleSave} T={T}>Save Trade</Btn>
      </div>
    </Modal>
  );
}

// ── Add Account Modal ─────────────────────────────────────────────────────────
function AddAccountModal({open,onClose,onSave,T}) {
  const [form,setForm]=useState({name:"",type:"futures",broker:"",size:"",currency:"USD",leveragePreset:50,leverageCustom:"",useCustomLev:false,consistencyRule:false,consistencyTarget:40});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const COLORS=["#00D4FF","#A78BFA","#FFD166","#06D6A0","#FF6B6B","#4ECDC4"];
  const [color,setColor]=useState("#00D4FF");
  const presets=form.type==="futures"?FUTURES_LEV:CFD_LEV;
  const effLev=form.useCustomLev?(parseFloat(form.leverageCustom)||1):(parseFloat(form.leveragePreset)||1);
  const notional=form.size?+form.size*effLev:null;
  const handlePreset=(val)=>{ if(val==="custom"){set("useCustomLev",true);}else{set("useCustomLev",false);set("leveragePreset",val);} };
  const handleSave=()=>{
    if(!form.name||!form.broker) return;
    onSave({...form,id:uid(),size:+form.size,color,leverage:effLev,createdAt:new Date().toISOString().slice(0,10),consistencyTarget:form.consistencyRule?+form.consistencyTarget:null});
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Link Trading Account" width={580} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {["futures","cfd"].map(t=>(
          <div key={t} onClick={()=>{set("type",t);set("useCustomLev",false);set("leveragePreset",t==="futures"?50:100);}} style={{border:`2px solid ${form.type===t?T.cyan:T.border}`,borderRadius:9,padding:13,cursor:"pointer",textAlign:"center",background:form.type===t?T.cyan+"11":"transparent"}}>
            <div style={{fontSize:22,marginBottom:4}}>{t==="futures"?"📈":"💱"}</div>
            <div style={{fontWeight:700,textTransform:"capitalize",fontFamily:"Space Grotesk",fontSize:13}}>{t}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{t==="futures"?"NQ, ES, CL, GC":"Forex, Gold, Indices"}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Field label="Account Name" T={T}><TInput T={T} placeholder="My Account #1" value={form.name} onChange={e=>set("name",e.target.value)}/></Field>
        <Field label="Broker / Firm" T={T}><TInput T={T} placeholder="Apex, FTMO, TopStep..." value={form.broker} onChange={e=>set("broker",e.target.value)}/></Field>
        <Field label="Account Size" T={T}><TInput T={T} type="number" placeholder="50000" value={form.size} onChange={e=>set("size",e.target.value)}/></Field>
        <Field label="Currency" T={T}><TSelect T={T} value={form.currency} onChange={e=>set("currency",e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>ZAR</option></TSelect></Field>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:9}}>⚡ Leverage</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:form.useCustomLev?10:0}}>
          {presets.map(p=>{
            const active=p.v==="custom"?form.useCustomLev:(!form.useCustomLev&&form.leveragePreset===p.v);
            return <button key={String(p.v)} onClick={()=>handlePreset(p.v)} style={{padding:"6px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:active?T.cyan+"33":"transparent",color:active?T.cyan:T.muted,border:`1px solid ${active?T.cyan+"66":T.border}`}}>{p.l}</button>;
          })}
        </div>
        {form.useCustomLev&&<Field label="Custom ratio" T={T}><TInput T={T} type="number" min={1} placeholder="e.g. 200" value={form.leverageCustom} onChange={e=>set("leverageCustom",e.target.value)}/></Field>}
        {form.size&&effLev>1&&(
          <div style={{padding:"7px 10px",background:T.cyan+"0D",border:`1px solid ${T.cyan}22`,borderRadius:7,display:"flex",gap:14,flexWrap:"wrap"}}>
            {[{l:"Capital",v:`${getCurrencySymbol(form.currency)}${Number(form.size).toLocaleString()}`},{l:"Leverage",v:`1:${effLev}`,c:T.cyan},{l:"Buying Power",v:`${getCurrencySymbol(form.currency)}${notional.toLocaleString()}`,c:T.gold}].map(s=>(
              <div key={s.l}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{s.l}</div><div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:12,color:s.c||T.text}}>{s.v}</div></div>
            ))}
          </div>
        )}
      </div>
      <Field label="Account Color" T={T}>
        <div style={{display:"flex",gap:8}}>{COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${color===c?T.white:"transparent"}`}}/>)}</div>
      </Field>
      <Card T={T} style={{marginBottom:14,padding:13}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:form.consistencyRule?10:0}}>
          <input type="checkbox" id="cr" checked={form.consistencyRule} onChange={e=>set("consistencyRule",e.target.checked)} style={{width:17,height:17,cursor:"pointer"}}/>
          <label htmlFor="cr" style={{fontSize:13,color:T.text,margin:0,cursor:"pointer"}}>Enable Consistency Score Tracking</label>
          <Badge label="PROP FIRM" color={T.gold}/>
        </div>
        {form.consistencyRule&&(
          <div>
            <div style={{fontSize:12,color:T.muted,marginBottom:8}}>No single day exceeds X% of total P&L</div>
            <Field label="Max single-day %" T={T}><TInput T={T} type="number" min={1} max={100} value={form.consistencyTarget} onChange={e=>set("consistencyTarget",e.target.value)}/></Field>
          </div>
        )}
      </Card>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onClose} T={T}>Cancel</Btn>
        <Btn onClick={handleSave} T={T}>Link Account</Btn>
      </div>
    </Modal>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark,setIsDark]=useState(()=>lsGet("tbk:dark",true));
  const [accounts,setAccounts]=useState(()=>lsGet("tbk:accounts",[]));
  const [trades,setTrades]=useState(()=>lsGet("tbk:trades",[]));
  const T=isDark?DARK:LIGHT;
  const [page,setPage]=useState("dashboard");
  const [addTradeOpen,setAddTradeOpen]=useState(false);
  const [addAccOpen,setAddAccOpen]=useState(false);
  const [journalTrade,setJournalTrade]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);

  useEffect(()=>{ lsSet("tbk:accounts",accounts); },[accounts]);
  useEffect(()=>{ lsSet("tbk:trades",trades); },[trades]);
  useEffect(()=>{ lsSet("tbk:dark",isDark); },[isDark]);

  const handleAddTrade=(t)=>setTrades(ts=>[...ts,t]);
  const handleAddAccount=(a)=>setAccounts(as=>[...as,a]);
  const handleUpdateTrade=(id,u)=>setTrades(ts=>ts.map(t=>t.id===id?{...t,...u}:t));
  const handleSaveJournal=(id,j)=>setTrades(ts=>ts.map(t=>t.id===id?{...t,...j}:t));
  const handleJournal=(trade)=>setJournalTrade(trade);

  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"◻"},
    {id:"calendar",label:"P&L Calendar",icon:"📅"},
    {id:"journal",label:"Trade Journal",icon:"📓"},
    {id:"tradelog",label:"Trade Log",icon:"📋"},
    {id:"reports",label:"Reports",icon:"📊"},
    {id:"trackrecord",label:"Track Record",icon:"🏆"},
    {id:"consistency",label:"Consistency",icon:"🎯"},
    {id:"videos",label:"Trade Reviews",icon:"🎬"},
  ];

  const totalPnl=trades.reduce((s,t)=>s+t.pnl,0);
  const journalCount=trades.filter(t=>t.journal||t.rationale||t.emotion||t.grade||t.mistakes).length;
  const currencies=[...new Set(accounts.map(a=>a.currency))];
  const pSym=currencies.length===1?getCurrencySymbol(currencies[0]):"$";
  const pVal=(totalPnl>=0?"+":"-")+pSym+Math.abs(totalPnl).toFixed(2);

  const PAGES={
    dashboard:<Dashboard accounts={accounts} trades={trades} onAddTrade={()=>setAddTradeOpen(true)} onAddAccount={()=>setAddAccOpen(true)} onJournal={handleJournal} T={T}/>,
    calendar:<PnLCalendar trades={trades} accounts={accounts} T={T}/>,
    journal:<JournalPage trades={trades} accounts={accounts} T={T} onJournal={handleJournal}/>,
    tradelog:<TradeLog trades={trades} accounts={accounts} onAddTrade={()=>setAddTradeOpen(true)} T={T} onJournal={handleJournal}/>,
    reports:<Reports trades={trades} accounts={accounts} T={T}/>,
    trackrecord:<TrackRecord trades={trades} accounts={accounts} T={T}/>,
    consistency:<Consistency accounts={accounts} trades={trades} T={T}/>,
    videos:<Videos trades={trades} accounts={accounts} onUpdateTrade={handleUpdateTrade} T={T}/>,
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:${T.bg};color:${T.text};font-family:'Inter',sans-serif;transition:background 0.3s,color 0.3s;}
    ::-webkit-scrollbar{width:5px;height:5px;}
    ::-webkit-scrollbar-track{background:${T.surface};}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:T.bg}}>

        <header style={{position:"sticky",top:0,zIndex:200,height:54,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",flexShrink:0}}>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{width:38,height:38,borderRadius:9,background:menuOpen?T.cyanDim:"transparent",border:`1px solid ${menuOpen?T.cyan+"44":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill={T.text}/>
              <rect x="2" y="9" width="16" height="2" rx="1" fill={T.text}/>
              <rect x="2" y="14" width="16" height="2" rx="1" fill={T.text}/>
            </svg>
          </button>
          <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:14,color:T.text,position:"absolute",left:"50%",transform:"translateX(-50%)",whiteSpace:"nowrap"}}>
            {NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{textAlign:"right"}}>
              <div style={{color:clr(totalPnl,T),fontWeight:700,fontFamily:"JetBrains Mono",fontSize:13}}>{pVal}</div>
              <div style={{fontSize:9,color:T.muted}}>{currencies.length===1?currencies[0]:"Multi"} P&L</div>
            </div>
            <button onClick={()=>setIsDark(d=>!d)} style={{width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",position:"relative",background:isDark?T.cyan:T.border,flexShrink:0}}>
              <div style={{position:"absolute",top:3,left:isDark?21:3,width:16,height:16,borderRadius:"50%",background:isDark?T.bg:T.white,transition:"left 0.25s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>{isDark?"🌙":"☀️"}</div>
            </button>
          </div>
        </header>

        {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:300,background:"#00000066"}}/>}

        <div style={{position:"fixed",top:0,left:0,bottom:0,width:260,zIndex:400,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transform:menuOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",boxShadow:menuOpen?"4px 0 24px rgba(0,0,0,0.4)":"none"}}>
          <div style={{padding:"16px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:32,height:32,borderRadius:8,background:T.cyanDim,border:`1px solid ${T.cyan}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:T.cyan,fontSize:16,fontWeight:700,fontFamily:"Space Grotesk"}}>K</span>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:T.cyan,fontFamily:"Space Grotesk"}}>TradesByKwazi</div>
                <div style={{fontSize:10,color:T.muted}}>tradesbykwazi.net</div>
              </div>
            </div>
            <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>x</button>
          </div>
          <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
            {NAV.map(n=>{
              const isPending=n.id==="journal"&&trades.length-journalCount>0;
              const active=page===n.id;
              return (
                <button key={n.id} onClick={()=>{setPage(n.id);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:9,background:active?T.cyanDim:"transparent",color:active?T.cyan:T.text,fontWeight:active?600:400,border:`1px solid ${active?T.cyan+"44":"transparent"}`,fontSize:13,textAlign:"left",width:"100%",cursor:"pointer"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                  <span style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:16,width:20,textAlign:"center"}}>{n.icon}</span>{n.label}</span>
                  {isPending&&<span style={{background:T.gold,color:T.bg,borderRadius:9,padding:"2px 7px",fontSize:10,fontWeight:700}}>{trades.length-journalCount}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"10px 8px 18px",display:"flex",flexDirection:"column",gap:8,borderTop:`1px solid ${T.border}`}}>
            <Btn T={T} onClick={()=>{setAddTradeOpen(true);setMenuOpen(false);}} style={{width:"100%",justifyContent:"center"}}>+ Log Trade</Btn>
            <Btn T={T} variant="ghost" onClick={()=>{setAddAccOpen(true);setMenuOpen(false);}} style={{width:"100%",justifyContent:"center"}}>+ Link Account</Btn>
          </div>
        </div>

        <main style={{flex:1,overflowY:"auto",padding:"20px 16px",background:T.bg}}>
          <div style={{marginBottom:4,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:14}}>
            <span style={{fontSize:11,color:T.muted}}>Journal coverage: <span style={{color:T.cyan,fontWeight:700,fontFamily:"JetBrains Mono"}}>{trades.length?Math.round(journalCount/trades.length*100):0}%</span></span>
            <span style={{fontSize:11,color:T.muted}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
          </div>
          <div style={{marginBottom:20}}/>
          {PAGES[page]}
        </main>
      </div>

      <AddTradeModal open={addTradeOpen} onClose={()=>setAddTradeOpen(false)} accounts={accounts} onSave={handleAddTrade} T={T}/>
      <AddAccountModal open={addAccOpen} onClose={()=>setAddAccOpen(false)} onSave={handleAddAccount} T={T}/>
      <JournalModal trade={journalTrade?trades.find(t=>t.id===journalTrade.id)||journalTrade:null} accounts={accounts} open={!!journalTrade} onClose={()=>setJournalTrade(null)} onSave={handleSaveJournal} T={T}/>
    </>
  );
}
