import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Flame } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toggleFlag, listMyFlags } from "@/lib/authed.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FlagButtons({ itemKind, itemId }: { itemKind: "word"|"sentence"|"text"; itemId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyFlags);
  const toggleFn = useServerFn(toggleFlag);
  const { data: flags } = useQuery({ queryKey: ["flags"], queryFn: () => listFn() });
  const isFav = !!flags?.find(f => f.item_kind === itemKind && f.item_id === itemId && f.flag === "favorite");
  const isHard = !!flags?.find(f => f.item_kind === itemKind && f.item_id === itemId && f.flag === "difficult");

  const mut = useMutation({
    mutationFn: (flag: "favorite"|"difficult") => toggleFn({ data: { itemKind, itemId, flag } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flags"] }),
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost" size="icon" type="button"
        onClick={() => mut.mutate("favorite")} aria-label="Favorite"
        className={cn(isFav && "text-primary")}
      >
        <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
      </Button>
      <Button
        variant="ghost" size="icon" type="button"
        onClick={() => mut.mutate("difficult")} aria-label="Mark difficult"
        className={cn(isHard && "text-accent")}
      >
        <Flame className={cn("h-4 w-4", isHard && "fill-current")} />
      </Button>
    </div>
  );
}