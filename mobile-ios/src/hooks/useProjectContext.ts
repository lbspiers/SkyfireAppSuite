// src/hooks/useProjectContext.ts
import { useSelector } from "react-redux";

export interface ProjectContext {
  projectId: string | undefined;
  companyId: string | undefined;
  project: any;
  company: any;
}

export function useProjectContext(): ProjectContext {
  const project = useSelector((store: any) => store?.project?.currentProject);
  const profile = useSelector((store: any) => store?.profile?.profile);

  return {
    projectId: project?.uuid,
    companyId: profile?.company?.uuid,
    project,
    company: profile?.company,
  };
}

export default useProjectContext;
