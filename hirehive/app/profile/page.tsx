"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/Field";
import Card from "@/components/Card";
import { getUser, homeFor, updateAccount } from "@/lib/auth";
import { Account, ROLE_LABELS, SAP_DOMAIN, needsSapEmail } from "@/lib/data";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [cvVisible, setCvVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
  const current = getUser();

  if (!current) {
    router.replace("/login");
  } else {
    setUser(current);
    setName(current.name);
    setEmail(current.email);
    setCvVisible(!!current.cvVisible);

    setCompanyDescription(current.companyDescription || "");
    setCompanyWebsite(current.companyWebsite || "");
    setCompanyIndustry(current.companyIndustry || "");
    setCompanyContact(current.companyContact || "");
  }
  }, [router]);
  if (!user) return null;
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMessage("Enter a valid email address."); return; }
    if (!user) return;
    if (needsSapEmail(user.role) && email.trim().toLowerCase() !== `${user.sapId}${SAP_DOMAIN}`) { setMessage(`This role must use its SAP email: ${user.sapId}${SAP_DOMAIN}`); return; }
    if (currentPassword || newPassword || confirmPassword) {
      if (currentPassword !== user.password) { setMessage("Current password is incorrect."); return; }
      if (newPassword.length < 8) { setMessage("New password must have at least 8 characters."); return; }
      if (newPassword !== confirmPassword) { setMessage("New password and confirmation do not match."); return; }
    }
    const other = (JSON.parse(localStorage.getItem("hirehive_accounts") || "[]") as Account[]).some(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.email.toLowerCase() !== user!.email.toLowerCase());
    if (other) { setMessage("That email is already in use."); return; }
  const changes: Partial<Account> = {
  name: name.trim(),
  email: email.trim().toLowerCase(),
  cvVisible,
};

if (user.role === "company") {
  changes.companyDescription = companyDescription.trim();
  changes.companyWebsite = companyWebsite.trim();
  changes.companyIndustry = companyIndustry.trim();
  changes.companyContact = companyContact.trim();
}    if (newPassword) changes.password = newPassword;
    updateAccount(user.email, changes);
    localStorage.setItem("hirehive_session", email.trim().toLowerCase());
    setUser({ ...user, ...changes });
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setMessage(newPassword ? "Profile and password updated in this browser." : "Profile updated in this browser.");
  }
  function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage("Please choose a CV smaller than 2 MB for this local demo."); return; }
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) { setMessage("Upload a PDF, DOC, or DOCX file."); return; }
    const reader = new FileReader();
    if (!user) return;
    const currentUser = user;
    reader.onload = () => {
  updateAccount(currentUser.email, {
    cvName: file.name,
    cvDataUrl: String(reader.result),
    cvVisible
  });
  setUser({
    ...currentUser,
    cvName: file.name,
    cvDataUrl: String(reader.result)
  });
  setMessage("CV saved in this browser demo.");
};
    reader.readAsDataURL(file);
  }
  return <main className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">My profile</h1><p className="text-sm text-muted">{ROLE_LABELS[user.role]}</p></div><button onClick={() => router.push(homeFor(user.role))} className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand">Back to dashboard</button></div>
    <Card title="Personal details"><form onSubmit={save} className="max-w-xl space-y-4"><Field label="Full name / company name" value={name} onChange={setName} /><Field label="Email" value={email} onChange={setEmail} />
    {user.role === "company" && (
  <>
    <Field
      label="Industry"
      value={companyIndustry}
      onChange={setCompanyIndustry}
      placeholder="e.g. Software Development"
    />

    <Field
      label="Company Website"
      value={companyWebsite}
      onChange={setCompanyWebsite}
      placeholder="https://example.com"
    />

    <Field
      label="Contact Information"
      value={companyContact}
      onChange={setCompanyContact}
      placeholder="Official contact number or email"
    />

    <div>
      <label className="mb-1 block text-sm font-semibold">
        Company Description
      </label>
      <textarea
        value={companyDescription}
        onChange={(e) => setCompanyDescription(e.target.value)}
        placeholder="Tell students about your company..."
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
    </div>

    <div className="rounded-lg bg-soft p-3 text-sm">
      <span className="font-semibold">Assigned Booth:</span>{" "}
      {user.boothNumber || "Not assigned yet"}
    </div>
  </>
)}<div className="rounded-lg bg-soft p-3 text-xs text-muted">Role: {ROLE_LABELS[user.role]}{user.department ? ` · Department: ${user.department}` : ""}{user.phase ? ` · ${user.phase}` : ""}</div>{user.role === "fyp" || user.role === "student" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cvVisible} onChange={e => setCvVisible(e.target.checked)} /> Allow approved companies to view my CV</label> : null}<div className="border-t border-line pt-4"><h3 className="mb-3 font-semibold">Change password</h3><div className="space-y-3"><Field label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} /><Field label="New password" type="password" value={newPassword} onChange={setNewPassword} hint="At least 8 characters." /><Field label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} /></div></div><button className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Save profile and password</button></form></Card>
    {(user.role === "fyp" || user.role === "student") && <Card title="CV upload"><p className="mb-3 text-sm text-muted">Upload a PDF, DOC, or DOCX file (maximum 2 MB in this prototype). Keep CV visibility off unless you want companies to view it.</p><input type="file" accept=".pdf,.doc,.docx" onChange={upload} className="block w-full text-sm" />{user.cvName && <p className="mt-3 text-sm">Current CV: <b>{user.cvName}</b> · {user.cvVisible ? "Visible to companies" : "Private"}</p>}{!user.cvName && <p className="mt-3 text-sm font-semibold text-amber-700">No CV uploaded yet.</p>}</Card>}
    {message && <p role="status" className="rounded-lg bg-soft p-3 text-sm">{message}</p>}
    <p className="text-xs text-muted">Prototype limitation: profiles, CV data, and sessions are stored in browser localStorage. Do not upload real sensitive CVs or use this authentication for production.</p>
  </main>;
}
