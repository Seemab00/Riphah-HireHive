"use client";

import Link from "next/link";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import { useTeams } from "@/lib/useTeams";

export default function AiRecommendationsPage() {
  const {teams}=useTeams();
  const ranked=teams.map(team=>{
    const templates=team.templateStatuses||{};
    const submitted=Object.values(templates).filter(v=>v==="Submitted"||v==="Reviewed").length;
    const reviewed=Object.values(templates).filter(v=>v==="Reviewed").length;
    const reasons:string[]=[]; let score=0;
    if(team.status==="Approved"){score+=20;reasons.push("Admin-approved team");}
    if(team.supervisor.trim()){score+=15;reasons.push("Supervisor recorded");}
    if(team.technology.trim()){score+=15;reasons.push("Technology details provided");}
    if(team.members.length>=3){score+=15;reasons.push("Full three-member team");}else{score+=team.members.length*5;reasons.push(`${team.members.length} member(s) recorded`);}
    score+=Math.min(20,submitted*5); if(submitted)reasons.push(`${submitted} template(s) submitted or reviewed`);
    score+=Math.min(15,reviewed*5); if(reviewed)reasons.push(`${reviewed} template(s) reviewed`);
    return {team,score:Math.min(100,score),reasons};
  }).sort((a,b)=>b.score-a.score);
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">AI-assisted team suggestions</h1><p className="text-sm text-muted">A transparent rules-based prototype. It is not a live AI model and does not make selection decisions.</p></div><div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><b>Prototype notice:</b> Scores are based only on the fields currently stored in HireHive. Defense-panel comments, quarterly reports, and Excel-imported data are not connected unless entered into the current records.</div><Card title="Ranked teams"><div className="space-y-3">{ranked.map((r,i)=><div key={r.team.id} className="rounded-lg border border-line p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{i+1}. {r.team.title}</p><p className="text-sm text-muted">{r.team.program} · {r.team.technology} · {r.team.members.length} member(s)</p></div><div className="text-right"><p className="text-2xl font-bold">{r.score}/100</p><Chip color={r.team.status==="Approved"?"green":"yellow"}>{r.team.status}</Chip></div></div><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Reasons contributing to score</p><ul className="mt-1 list-disc pl-5 text-sm">{r.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>)}{ranked.length===0&&<p className="py-6 text-center text-sm text-muted">No teams to evaluate yet. Register a team first.</p>}</div></Card><p className="text-sm text-muted">Use these suggestions as decision support only. Review actual submissions, quarterly reports, and defense-panel feedback before making an institutional decision. <Link href="/admin/registrations" className="text-brand underline">Open team registrations</Link>.</p></div>;
}
