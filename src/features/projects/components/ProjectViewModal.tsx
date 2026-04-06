import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { getProjectById, type ProjectItem } from "../services/projectService";
import { formatDate } from "../../../utils/date";
import Loader from "../../../components/ui/Loader";

type Props = {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
};

const ProjectViewModal = ({ open, projectId, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<ProjectItem | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open || !projectId) return;

    const load = async () => {
      setLoading(true);
      try {
        const p = await getProjectById(projectId);
        setProject(p);
      } catch (e: unknown) {
        let message = "Failed to load projects";
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

    load();
  }, [open, projectId]);

  const footer = (
    <div className="flex items-center justify-end">
      <button
        onClick={onClose}
        className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        title="Project Details"
        onClose={onClose}
        footer={footer}
      >
        {loading ? (
          <Loader variant="block" label="Loading Projects..." />
        ) : !project ? (
          <div className="text-sm text-slate-600">No data</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Project Name</p>
                  <p className="font-medium text-slate-800">{project.name}</p>
                </div>

                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium text-slate-800 capitalize">
                    {project.status}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Start Date</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(project.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Time Limit</p>
                  <p className="font-medium text-slate-800">
                    {project.timeLimit}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Team Leader</p>
                  <p className="font-medium text-slate-800">
                    {project.createdBy?.name ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-sm">Description</p>
              <p className="text-sm text-slate-800 mt-1">
                {project.description}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-sm mb-2">Project Members</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                {project.employees?.length ? (
                  <ul className="space-y-2 text-sm">
                    {project.employees.map((m) => (
                      <li
                        key={m._id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-slate-800">{m.name}</span>
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
        )}
      </Modal>

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMsg}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </>
  );
};

export default ProjectViewModal;
