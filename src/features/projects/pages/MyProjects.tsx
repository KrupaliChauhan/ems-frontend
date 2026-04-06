import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { InputField } from "../../../components/ui/InputField";
import { myProjects, type ProjectItem } from "../services/projectService";
import { formatDate } from "../../../utils/date";
import Loader from "../../../components/ui/Loader";

const MyProjects = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await myProjects({ search, status });
      setItems(res.items || []);
    } catch (e: unknown) {
      let message = "Failed to fetch my projects";
      if (e instanceof Error) {
        message = e.message;
      } else if (typeof e === "string") {
        message = e;
      }
      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">My Projects</h2>
        <p className="text-sm text-slate-500">
          Here are the projects assigned to you
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:flex-1">
          <InputField label="Search" value={search} onChange={setSearch} placeholder="Search project..." />
        </div>
        <div className="md:w-56">
          <SelectDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" }
            ]}
          />
        </div>
        <Button variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading projects..." />
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
          No projects assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {items.map((p) => (
            <div
              key={p._id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {p.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    p.status === "active"
                      ? "bg-green-100 text-green-700"
                      : p.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-slate-500">Start Date</p>
                  <p className="text-slate-800 font-medium">
                    {formatDate(p.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Time Limit</p>
                  <p className="text-slate-800 font-medium">{p.timeLimit}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-slate-500 text-sm mb-2">Project Members</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {p.employees?.length ? (
                    <ul className="space-y-1 text-sm text-slate-700">
                      {p.employees.map((m) => (
                        <li key={m._id} className="flex justify-between">
                          <span>{m.name}</span>
                          <span className="text-slate-500">{m.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No members</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMsg}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </div>
  );
};

export default MyProjects;
