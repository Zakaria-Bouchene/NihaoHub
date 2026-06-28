import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCollections, createCollection, deleteCollection } from "@/lib/authed.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/collections/")({
  component: CollectionsList,
});

function CollectionsList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const listFn = useServerFn(listCollections);
  const createFn = useServerFn(createCollection);
  const deleteFn = useServerFn(deleteCollection);
  const { data: cols } = useQuery({ queryKey: ["collections"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [pub, setPub] = useState(false);

  const create = useMutation({
    mutationFn: () => createFn({ data: { name, description: desc, isPublic: pub } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      setOpen(false); setName(""); setDesc(""); setPub(false);
      navigate({ to: "/collections/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-3xl font-semibold">Collections</h1>
          <p className="mt-1 text-muted-foreground">Build, clone, share, and study your own decks.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New collection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New collection</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} maxLength={120} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000} /></div>
              <div className="flex items-center gap-2"><Switch id="pub" checked={pub} onCheckedChange={setPub} /><Label htmlFor="pub">Public — others can clone</Label></div>
              <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(cols ?? []).map(c => (
          <Card key={c.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <Link to="/collections/$id" params={{ id: c.id }} className="flex-1">
                <p className="font-serif-display text-lg font-semibold">{c.name}</p>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description || "No description"}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {c.is_public && <span className="rounded bg-accent/10 px-2 py-0.5 text-accent">Public</span>}
              {c.cloned_from && <span className="rounded bg-muted px-2 py-0.5">Clone</span>}
            </div>
          </Card>
        ))}
        {cols && cols.length === 0 && (
          <Card className="col-span-full p-8 text-center text-muted-foreground">No collections yet — create your first one.</Card>
        )}
      </div>
    </div>
  );
}