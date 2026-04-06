import { useContext } from "react";
import { DesignationContext } from "./designation-context";

export const useDesignations = () => {
  const ctx = useContext(DesignationContext);
  if (!ctx)
    throw new Error("useDesignations must be used inside DesignationProvider");
  return ctx;
};
