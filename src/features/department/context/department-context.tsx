import React, { createContext, useState } from "react";

export type Department = {
  id: number;
  name: string;
  status: "Active" | "Inactive";
};  

type DepartmentContextType = {
  departments: Department[];
  addDepartment: (d: { name: string; status: "Active" | "Inactive" }) => void;
  updateDepartment: (id: number, d: { name: string; status: "Active" | "Inactive" }) => void;
  deleteDepartment: (id: number) => void;
};

const DepartmentContext = createContext<DepartmentContextType | null>(null);

const initialDepartments: Department[] = [
  { id: 1, name: "Engineering", status: "Active" },
  { id: 2, name: "HR", status: "Active" },
  { id: 3, name: "Finance", status: "Inactive" },
];

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  const addDepartment = (d: { name: string; status: "Active" | "Inactive" }) => {
    setDepartments((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1;
      return [...prev, { id: nextId, name: d.name, status: d.status }];
    });
  };

  const updateDepartment = (id: number, d: { name: string; status: "Active" | "Inactive" }) => {
    setDepartments((prev) =>
      prev.map((dep) => (dep.id === id ? { ...dep, name: d.name, status: d.status } : dep))
    );
  };

  const deleteDepartment = (id: number) => {
    setDepartments((prev) => prev.filter((dep) => dep.id !== id));
  };

  return (
    <DepartmentContext.Provider value={{ departments, addDepartment, updateDepartment, deleteDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
};

export { DepartmentContext };
