"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Chip from "@/components/Chip";
import { useStore } from "@/lib/useStore";
import { Account, KEYS } from "@/lib/data";

const defaults = [
  { name: "Tazzaina Malik", email: "tazzaina.malik@riphah.edu.pk", level: "incharge" as const, department: "All" as const, phase: "All" as const },
  { name: "Ms. Saleha Nasim", email: "saleha.nasim@riphah.edu.pk", level: "faculty" as const, department: "SE" as const, phase: "All" as const },
  { name: "Ms. Nimra Shoukat", email: "nimra.shoukat@riphah.edu.pk", level: "faculty" as const, department: "CA" as const, phase: "All" as const },
  { name: "Ms. Rehana Sanam", email: "rehana.sanam@riphah.edu.pk", level: "faculty" as const, department: "CS" as const, phase: "All" as const },
  { name: "Sehrish", email: "", level: "student" as const, department: "All" as const, phase: "FYP1" as const },
  { name: "Neha", email: "", level: "student" as const, department: "All" as const, phase: "FYP2" as const },
];

export default function StaffPage() {
  const [accounts, setAccounts] = useStore<Account[]>(KEYS.accounts, []);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [level, setLevel] = useState<Account["coordinatorLevel"]>("faculty"); const [department, setDepartment] = useState<Account["department"]>("SE"); const [phase, setPhase] = useState<Account["phase"]>("All"); const [message, setMessage] = useState("");
  function create(e: React.FormEvent) { e.preventDefault(); const normalized=email.trim().toLowerCase(); if (!name.trim() || !/^\S+@\S+\.\S+$/.test(normalized) || password.length < 8) { setMessage("Enter a name, valid email, and temporary password of at least 8 characters."); return; } if (accounts.some(a => a.email.toLowerCase()===normalized)) { setMessage("An account already exists for this email."); return; } setAccounts([...accounts,{name:name.trim(),email:normalized,password,role:"coordinator",coordinatorLevel:level,department,phase}]); setName("");setEmail("");setPassword("");setMessage("Staff account created in this browser. Share credentials securely; email delivery is not configured."); }
  const staff=accounts.filter(a=>a.role==="coordinator");
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Team members and coordinators</h1><p className="text-sm text-muted">Create staff accounts and restrict their work by role, department, and FYP phase.</p></div>
    <Card title="Create coordinator / sub-admin"><form onSubmit={create} className="grid gap-4 md:grid-cols-2"><Field label="Full name" value={name} onChange={setName}/><Field label="Email" value={email} onChange={setEmail}/><Field label="Temporary password" type="password" value={password} onChange={setPassword} hint="At least 8 characters; change after first login when a production auth system exists."/><div><label className="mb-1 block text-sm font-semibold">Role level</label><select value={level} onChange={e=>setLevel(e.target.value as Account["coordinatorLevel"])} className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"><option value="student">FYP Student Coordinator</option><option value="faculty">Faculty Coordinator</option><option value="incharge">Primary FYP Incharge</option></select></div><div><label className="mb-1 block text-sm font-semibold">Department</label><select value={department} onChange={e=>setDepartment(e.target.value as Account["department"])} className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"><option value="All">All departments</option><option value="SE">SE</option><option value="CA">CA</option><option value="CS">CS</option></select></div><div><label className="mb-1 block text-sm font-semibold">FYP phase</label><select value={phase} onChange={e=>setPhase(e.target.value as Account["phase"])} className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"><option value="All">All phases</option><option value="FYP1">FYP1</option><option value="FYP2">FYP2</option></select></div><div className="md:col-span-2"><button className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Create staff account</button></div></form>{message&&<p className="mt-3 rounded-lg bg-soft p-3 text-sm">{message}</p>}<p className="mt-3 text-xs text-muted">Demo limitation: account records are saved in browser localStorage and the system does not send invitation emails. This is not suitable for production credentials.</p></Card>
    <Card title="Known staff structure"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted"><th className="py-2">Name</th><th>Email</th><th>Level</th><th>Department / phase</th><th>Account</th></tr></thead><tbody>{defaults.map((d,i)=>{const a=accounts.find(x=>x.email.toLowerCase()===d.email.toLowerCase()&&d.email);return <tr key={i} className="border-t border-line"><td className="py-3 font-semibold">{d.name}</td><td>{d.email||"Not provided — add email to create login"}</td><td>{d.level==="incharge"?"Primary FYP Incharge":d.level==="faculty"?"Faculty Coordinator":"Student Coordinator"}</td><td>{d.department} · {d.phase}</td><td>{a?<Chip color="green">Created</Chip>:<Chip color="blue">Not created</Chip>}</td></tr>})}{staff.filter(a=>!defaults.some(d=>d.email&&d.email.toLowerCase()===a.email.toLowerCase())).map(a=><tr key={a.email} className="border-t border-line"><td className="py-3 font-semibold">{a.name}</td><td>{a.email}</td><td>{a.coordinatorLevel}</td><td>{a.department} · {a.phase}</td><td><Chip color="green">Created</Chip></td></tr>)}</tbody></table></div></Card>
  </div>;
}
