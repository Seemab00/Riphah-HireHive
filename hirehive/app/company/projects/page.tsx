"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import Field from "@/components/Field";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";

type CompanyProject = {
  id: string;
  title: string;
  description: string;
  technologies: string;
  faculty: string;
  phase: string;
  groupName: string;
  supervisor: string;
};

function isCompanyProject(value: unknown): value is CompanyProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const project = value as Record<string, unknown>;
  return [
    "id",
    "title",
    "description",
    "technologies",
    "faculty",
    "phase",
    "groupName",
    "supervisor",
  ].every((field) => typeof project[field] === "string");
}

export default function CompanyProjectsPage() {
  const [projects, setProjects] = useState<CompanyProject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/company/projects", {
          cache: "no-store",
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Could not load approved projects.";
          throw new Error(message);
        }

        const data =
          result &&
          typeof result === "object" &&
          "projects" in result &&
          Array.isArray(result.projects)
            ? result.projects.filter(isCompanyProject)
            : null;

        if (!data) throw new Error("The project response was invalid.");
        if (active) setProjects(data);
      } catch (loadError) {
        if (active) {
          setProjects([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load approved projects."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, [retry]);

  const shownProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) =>
      [project.title, project.description, project.technologies].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [projects, search]);

  return (
    <RoleGuard role="company">
      <TopBar
        links={[
          { label: "Dashboard", href: "/company" },
          { label: "Approved FYP Projects", href: "/company/projects" },
        ]}
      />
      <main className="space-y-6 p-6 md:px-12">
        <header>
          <h1 className="text-3xl font-bold">Approved FYP Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Browse projects approved by the Faculty and Admin.
          </p>
        </header>

        <Card>
          <Field
            label="Search projects"
            value={search}
            onChange={setSearch}
            placeholder="Search project title, description, technologies or tools"
          />
        </Card>

        {loading ? (
          <p className="text-sm text-muted" role="status">
            Loading approved projects...
          </p>
        ) : error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((count) => count + 1)}
              className="mt-3 rounded-lg bg-brand px-4 py-2 font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : shownProjects.length === 0 ? (
          <p className="text-center text-sm text-muted">
            {projects.length === 0
              ? "No approved FYP projects are available yet."
              : "No projects match your search."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shownProjects.map((project) => (
              <Card key={project.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip color="teal">{project.phase}</Chip>
                  <span className="text-sm text-muted">{project.faculty}</span>
                </div>

                <h2 className="mt-3 text-lg font-bold">
                  {project.title || "Project title not provided"}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {project.description || "Project description not provided."}
                </p>

                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="font-semibold">Technologies and tools</dt>
                    <dd className="text-muted">
                      {project.technologies || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Group</dt>
                    <dd className="text-muted">{project.groupName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Supervisor</dt>
                    <dd className="text-muted">
                      {project.supervisor || "Not provided"}
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RoleGuard>
  );
}
