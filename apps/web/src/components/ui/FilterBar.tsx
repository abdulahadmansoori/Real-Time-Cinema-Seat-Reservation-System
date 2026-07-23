"use client";

export type FilterField = {
  key: string;
  label: string;
  type: "text" | "select" | "date";
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export function FilterBar({
  fields,
  values,
  onChange,
  onSubmit,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {fields.map((f) => (
        <label key={f.key} className="item">
          <span>{f.label}</span>
          {f.type === "select" ? (
            <select
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              <option value="">All</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === "date" ? "date" : "text"}
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
        </label>
      ))}
      <button type="submit">Apply</button>
      <style jsx>{`
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: end;
          margin-bottom: 1rem;
        }
        .item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        input,
        select,
        button {
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          border-radius: 8px;
          padding: 0.45rem 0.6rem;
        }
        button {
          background: var(--accent);
          color: white;
          border: none;
          font-weight: 600;
          cursor: pointer;
          height: 36px;
        }
      `}</style>
    </form>
  );
}
