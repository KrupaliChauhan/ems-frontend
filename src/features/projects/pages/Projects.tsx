import ProjectsAdmin from "./projectsAdmin.tsx";
import MyProjects from "./MyProjects.tsx";
import { getSession, hasAccess } from "../../auth/services/auth";

const Projects = () => {
  const { user } = getSession();

  if (!user) return null;

  if (hasAccess(user.role, "projectManage")) {
    return <ProjectsAdmin />;
  }

  return <MyProjects />;
};

export default Projects;
