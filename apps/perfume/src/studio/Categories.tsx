import { useState } from "react";
import { I } from "../components/icons";
import { Button, Card, Field, Input, Modal, Textarea } from "../components/ui";
import { useStore } from "../lib/store";
import { uid } from "../lib/format";
import { navigate } from "../lib/router";
import type { Collection, Family } from "../lib/types";
import { PageHead } from "./StudioLayout";

type Editing = { kind: "family"; item: Family } | { kind: "collection"; item: Collection } | null;

export function Categories() {
  const { db, saveFamily, deleteFamily, saveCollection, deleteCollection, toast } = useStore();
  const [edit, setEdit] = useState<Editing>(null);
  const count = (k: "familyId" | "collectionId", id: string) => db.products.filter((p) => p[k] === id).length;

  const save = () => {
    if (!edit) return;
    if (!edit.item.name.trim()) return toast("Name is required.", "error");
    if (edit.kind === "family") saveFamily(edit.item);
    else saveCollection(edit.item);
    toast("Saved", "success");
    setEdit(null);
  };

  return (
    <div className="rise">
      <PageHead eyebrow="Organise" title="Categories" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Collections</h2>
              <p className="text-xs text-muted">Product lines shown on the storefront</p>
            </div>
            <Button size="sm" onClick={() => setEdit({ kind: "collection", item: { id: uid("col-"), name: "", description: "" } })}>
              <I.plus size={14} /> Add
            </Button>
          </div>
          {db.collections.map((c) => (
            <Row
              key={c.id}
              swatch={<span className="grid size-10 place-items-center rounded-full bg-soft font-display">{c.name.charAt(0)}</span>}
              title={c.name}
              sub={c.description}
              n={count("collectionId", c.id)}
              onOpen={() => navigate(`/shop?collection=${c.id}`)}
              onEdit={() => setEdit({ kind: "collection", item: { ...c } })}
              onDelete={() => confirm(`Delete collection “${c.name}”? Products stay but lose this collection.`) && deleteCollection(c.id)}
            />
          ))}
          {db.collections.length === 0 && <p className="py-6 text-center text-sm text-muted">No collections yet.</p>}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold">Olfactory families</h2>
              <p className="text-xs text-muted">Used for filters, chips and stock reports</p>
            </div>
            <Button size="sm" onClick={() => setEdit({ kind: "family", item: { id: uid("fam-"), name: "", description: "", color: "#C9A46B" } })}>
              <I.plus size={14} /> Add
            </Button>
          </div>
          {db.families.map((f) => (
            <Row
              key={f.id}
              swatch={<span className="size-10 rounded-full" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}88)` }} />}
              title={f.name}
              sub={f.description}
              n={count("familyId", f.id)}
              onOpen={() => navigate(`/shop?family=${f.id}`)}
              onEdit={() => setEdit({ kind: "family", item: { ...f } })}
              onDelete={() => confirm(`Delete family “${f.name}”?`) && deleteFamily(f.id)}
            />
          ))}
        </Card>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `${db[edit.kind === "family" ? "families" : "collections"].some((x) => x.id === edit.item.id) ? "Edit" : "New"} ${edit.kind}` : ""}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-3">
            <Field label="Name">
              <Input autoFocus value={edit.item.name} onChange={(e) => setEdit({ ...edit, item: { ...edit.item, name: e.target.value } } as Editing)} />
            </Field>
            <Field label="Description">
              <Textarea className="min-h-20" value={edit.item.description} onChange={(e) => setEdit({ ...edit, item: { ...edit.item, description: e.target.value } } as Editing)} />
            </Field>
            {edit.kind === "family" && (
              <Field label="Colour">
                <div className="flex items-center gap-3">
                  <input type="color" value={edit.item.color} onChange={(e) => setEdit({ kind: "family", item: { ...edit.item, color: e.target.value } })} className="h-11 w-16 cursor-pointer rounded-xl border border-line bg-transparent" />
                  <span className="font-mono text-xs text-muted">{edit.item.color}</span>
                </div>
              </Field>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ swatch, title, sub, n, onOpen, onEdit, onDelete }: { swatch: React.ReactNode; title: string; sub: string; n: number; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      {swatch}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted">{sub || "—"}</p>
      </div>
      <span className="text-xs text-muted">{n} products</span>
      <div className="flex">
        <button aria-label="View in store" onClick={onOpen} className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink">
          <I.store size={15} />
        </button>
        <button aria-label="Edit" onClick={onEdit} className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink">
          <I.edit size={15} />
        </button>
        <button aria-label="Delete" onClick={onDelete} className="grid size-8 place-items-center rounded-full text-muted hover:bg-bad/10 hover:text-bad">
          <I.trash size={15} />
        </button>
      </div>
    </div>
  );
}
