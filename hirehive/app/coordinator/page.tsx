"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import { getUser, logout } from "@/lib/auth";
import { Account, KEYS } from "@/lib/data";
import { useStore } from "@/lib/useStore";

export default function CoordinatorDashboard() {
  const router=useRouter(); const [user,setUser]=useState<Account|null>(null); const [accounts,setAccounts]=useStore<Account[]>(KEYS.accounts,[]); const [message,setMessage]=useState("");
  useEffect(()=>{const u=getUser();if(!u)router.replace("/login");else if(u.role!=="coordinator")router.replace("/"+u.role);else setUser(u);},[router]);
  if(!user)return null;
  const stage=user.coordinatorLevel==="student"?1:user.coordinatorLevel==="faculty"?2:3;
  const pending=accounts.filter(a=>a.role==="volunteer"&&(a.volunteerStage??1)===stage);
  const label=stage===1?"FYP Student Coordinator":stage===2?"Faculty Coordinator":"Primary FYP Incharge";
  function decide(vol:Account,approve:boolean){const next=approve?stage+1:-1;const decisions=[...(vol.volunteerStageDecisions??["Pending","Pending","Pending"])];decisions[stage-1]=approve?(stage===3?"Selected":"Recommended"):"Rejected";setAccounts(accounts.map(a=>a.email===vol.email?{...a,volunteerStage:next,volunteerStageDecisions:decisions,volunteerStatus:next===4?"Approved":next===-1?"Rejected":"Pending"}:a));setMessage(`${vol.name}: ${approve?(stage===3?"selected":"moved to the next stage"):"rejected"}.`);}
  return <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-10"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Coordinator dashboard</h1><p className="mt-1 text-sm text-muted">{user.name} · {label} · {user.department} · {user.phase}</p></div><div className="flex gap-2"><button onClick={()=>router.push("/profile")} className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand">My profile</button><button onClick={()=>{logout();router.push("/login")}} className="rounded-lg border px-4 py-2 text-sm">Log out</button></div></div>
    <div className="grid gap-4 md:grid-cols-3"><Card title="Stage"><p className="text-2xl font-bold">{stage} of 3</p><p className="text-sm text-muted">{label}</p></Card><Card title="Awaiting review"><p className="text-2xl font-bold">{pending.length}</p><p className="text-sm text-muted">Volunteer applications at your stage</p></Card><Card title="Scope"><p className="text-lg font-bold">{user.department||"All departments"}</p><p className="text-sm text-muted">{user.phase||"All phases"}</p></Card></div>
    <Card title="Volunteer applications awaiting your decision"><p className="mb-4 text-sm text-muted">Workflow: Student Coordinator → Faculty Coordinator → Primary FYP Incharge final decision. Recommendations move applications forward; the last stage selects volunteers.</p><div className="space-y-3">{pending.map(v=><div key={v.email} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4"><div><p className="font-semibold">{v.name}</p><p className="text-sm text-muted">{v.email} · SAP {v.sapId||"not supplied"} · {v.program||"program not supplied"}</p><p className="mt-1 text-xs text-muted">Experience: {v.volunteerExperience||"No experience details supplied"}</p><p className="mt-1 text-xs text-muted">Prior stages: {(v.volunteerStageDecisions||["Pending","Pending","Pending"]).slice(0,stage-1).join(" → ")||"Not reviewed"}</p></div><div className="flex gap-2"><button onClick={()=>decide(v,true)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">{stage===3?"Select volunteer":"Recommend / approve stage"}</button><button onClick={()=>decide(v,false)} className="rounded-lg border border-red-600 px-3 py-2 text-xs font-semibold text-red-700">Reject</button></div></div>)}{pending.length===0&&<p className="py-6 text-center text-sm text-muted">No applications are currently waiting at your stage.</p>}</div>{message&&<p role="status" className="mt-3 rounded-lg bg-soft p-3 text-sm">{message}</p>}</Card>
    <p className="text-xs text-muted">Prototype limitation: role and department checks happen in the browser. Production access control must be enforced by a server.</p>
  </main>;
}
