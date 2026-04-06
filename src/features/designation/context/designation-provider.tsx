import React, { useState } from "react";
import { DesignationContext, type Designation } from "./designation-context";

const initialDesignations: Designation[] = [
  { id: 1, name: "Frontend Developer", status: "Active" },
  { id: 2, name: "Backend Developer", status: "Active" },
  { id: 3, name: "HR Executive", status: "Active" },
  { id: 4, name: "Accountant", status: "Inactive" },
  { id: 5, name:"project manager", status: "Active"}
];

export const DesignationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations);

  const addDesignation = (d: { name: string; status: "Active" | "Inactive" }) => {
    setDesignations(prev => {
      const nextId = prev.length ? Math.max(...prev.map(x => x.id)) + 1 : 1;
      return [...prev, { id: nextId, name: d.name, status: d.status }];
    });
  };

  const updateDesignation = (id: number, d: { name: string; status: "Active" | "Inactive" }) => {
    setDesignations(prev =>
      prev.map(des => des.id === id ? { ...des, name: d.name, status: d.status } : des)
    );
  };

  const deleteDesignation = (id: number) => {
    setDesignations(prev => prev.filter(des => des.id !== id));
  };

  return (
    <DesignationContext.Provider value={{ designations, addDesignation, updateDesignation, deleteDesignation }}>
      {children}
    </DesignationContext.Provider>
  );
};
