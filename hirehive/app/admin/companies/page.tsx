
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Company = {
  id: string;
  name: string;
  city: string;
  address: string;
  website?: string;
  phone?: string;
  field: string;
  registered: boolean;
  source?: string;
};

export default function CompanyDirectoryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [selected, setSelected] = useState<Company | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/company-directory", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load companies.");
        }

        setCompanies(data.companies ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setLoadError(
          err instanceof Error ? err.message : "Could not load companies."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCompanies();

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = [
        company.name,
        company.field,
        company.address,
        company.city,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return (
        matchesSearch &&
        (city === "All" || company.city === city)
      );
    });
  }, [companies, search, city]);

  async function sendInvitation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;

    setSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role: "company",
          name: selected.name,
          message: `Riphah International University, Gulberg Green Campus, invites ${selected.name} to participate in our FYP Open House and project showcase. We would be pleased to connect your organization with our BS Software Engineering, BS Computer Science and BS Computer Arts students.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Invitation could not be created."
        );
      }

      setMessage(
        data.link
          ? `Invitation created. Registration link: ${data.link}`
          : "Invitation request completed. Check the Admin Email Outbox."
      );

      setSelected(null);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Admin / Companies
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Company Directory
        </h1>

        <p className="mt-2 text-slate-600">
          Find IT and software companies in Islamabad and Rawalpindi
          and invite them to the Riphah GGC FYP Open House.
        </p>
      </div>

      {message && (
        <div className="break-words rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 font-semibold underline"
          >
            Reload page
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or technology..."
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm"
        />

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
        >
          <option value="All">Both cities</option>
          <option value="Islamabad">Islamabad</option>
          <option value="Rawalpindi">Rawalpindi</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Listed companies
        </h2>

        <span className="text-sm text-slate-500">
          {loading ? "Loading..." : `${filtered.length} companies`}
        </span>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading companies from OpenStreetMap...
        </div>
      )}

      {!loading && !loadError && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((company) => (
              <div
                key={company.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">
                    {company.name}
                  </h3>

                  <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                    {company.city}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {company.field}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {company.address}
                </p>

                {company.phone && (
                  <p className="mt-2 text-sm text-slate-600">
                    Phone: {company.phone}
                  </p>
                )}

                {company.website && (
                  <p className="mt-1 text-sm">
                    <a
                      href={
                        company.website.startsWith("http")
                          ? company.website
                          : `https://${company.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-teal-700 underline"
                    >
                      Visit website
                    </a>
                  </p>
                )}

                {company.source && (
                  <p className="mt-2 text-xs text-slate-400">
                    <a
                      href={company.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      OpenStreetMap source
                    </a>
                  </p>
                )}

                {company.registered ? (
                  <div className="mt-4 inline-block rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
                    Already Registered
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelected(company);
                      setEmail("");
                      setError("");
                      setMessage("");
                    }}
                    className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                  >
                    Send invitation
                  </button>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
              No companies match your search.
            </p>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={sendInvitation}
            className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Invite {selected.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the company’s verified contact email address.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Company email

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
              />
            </label>

            <p className="text-xs text-slate-500">
              A secure, time-limited registration link will be created for this company.
            </p>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending ? "Sending..." : "Create invitation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
