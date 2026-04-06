import { createContext } from "react";

export type Designation = {
  id: number;
  name: string;
  status: "Active" | "Inactive";
};

export type DesignationContextType = {
  designations: Designation[];
  addDesignation: (d: { name: string; status: "Active" | "Inactive" }) => void;
  updateDesignation: (id: number, d: { name: string; status: "Active" | "Inactive" }) => void;
  deleteDesignation: (id: number) => void;
};

export const DesignationContext =
  createContext<DesignationContextType | null>(null);
