import type { ReactNode } from "react";
import type { UserRole } from "../../auth/services/auth";
import type { CommunicationMeta, TargetingPayload } from "../services/communicationService";

type Props = {
  meta: CommunicationMeta | null;
  value: TargetingPayload;
  onChange: (value: TargetingPayload) => void;
  error?: string;
};

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function MultiSelectBlock(props: {
  label: string;
  options: Array<{ id?: string; value?: string; name?: string; label?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  extraControl?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{props.label}</p>
        {props.extraControl}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {props.options.map((option) => {
          const key = option.id || option.value || "";
          const label = option.name || option.label || "";
          return (
            <label key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={props.selected.includes(key)}
                onChange={() => props.onToggle(key)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600"
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function AudienceTargetEditor({ meta, value, onChange, error }: Props) {
  const update = (patch: Partial<TargetingPayload>) => onChange({ ...value, ...patch });
  const allUserIds = meta?.users.map((item) => item.id) || [];
  const areAllUsersSelected =
    allUserIds.length > 0 && allUserIds.every((userId) => value.userIds.includes(userId));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            checked={value.allEmployees}
            onChange={(e) => update({ allEmployees: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-teal-600"
          />
          All Employees
        </label>
        <p className="mt-2 text-xs text-slate-500">
          If enabled, announcement or event will be visible to all active users in the system.
        </p>
      </div>

      <MultiSelectBlock
        label="Departments"
        options={meta?.departments.map((item) => ({ id: item.id, name: item.name })) || []}
        selected={value.departmentIds}
        onToggle={(selectedId) => update({ departmentIds: toggleInList(value.departmentIds, selectedId) })}
      />

      <MultiSelectBlock
        label="Roles"
        options={(meta?.roles || []).map((role) => ({ value: role, label: role }))}
        selected={value.roleKeys}
        onToggle={(selectedRole) =>
          update({ roleKeys: toggleInList(value.roleKeys as string[], selectedRole) as UserRole[] })
        }
      />

      <MultiSelectBlock
        label="Designations"
        options={meta?.designations.map((item) => ({ id: item.id, name: item.name })) || []}
        selected={value.designationIds}
        onToggle={(selectedId) => update({ designationIds: toggleInList(value.designationIds, selectedId) })}
      />

      <MultiSelectBlock
        label="Projects / Teams"
        options={meta?.projects.map((item) => ({ id: item.id, name: item.name })) || []}
        selected={value.projectIds}
        onToggle={(selectedId) => update({ projectIds: toggleInList(value.projectIds, selectedId) })}
      />

      <MultiSelectBlock
        label="Specific Users"
        options={meta?.users.map((item) => ({ id: item.id, name: `${item.name} (${item.email})` })) || []}
        selected={value.userIds}
        onToggle={(selectedId) => update({ userIds: toggleInList(value.userIds, selectedId) })}
        extraControl={
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
            <input
              type="checkbox"
              checked={areAllUsersSelected}
              disabled={allUserIds.length === 0}
              onChange={(event) =>
                update({
                  userIds: event.target.checked ? allUserIds : []
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-teal-600"
            />
            <span>All Users</span>
          </label>
        }
      />
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
