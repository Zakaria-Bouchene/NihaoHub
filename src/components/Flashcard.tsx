import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { recordReview } from "@/lib/authed.functions";
import { useStudy } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { FlagButtons } from "./FlagButtons";

export interface StudyCard {
  item_kind: "word" | "sentence";
  item_id: string;
  data: { id: string; chinese: string; pinyin: string; english: string };
}

export function Flashcard({
  card, onNext, reverse = false,
}: { card: StudyCard; onNext: () => void; reverse?: boolean }) {
  const { reveal, nextReveal, reset } = useStudy();
  const qc = useQueryClient();
  const recordFn = useServerFn(recordReview);
  const mut = useMutation({
    mutationFn: (rating: "again"|"hard"|"good"|"easy") =>
      recordFn({ data: { itemKind: card.item_kind, itemId: card.item_id, rating, reverse } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats"] });
      reset();
      onNext();
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); reveal < 2 ? nextReveal() : null; return; }
      if (reveal < 2) return;
      if (e.key === "1") mut.mutate("again");
      else if (e.key === "2") mut.mutate("hard");
      else if (e.key === "3") mut.mutate("good");
      else if (e.key === "4") mut.mutate("easy");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reveal, mut, nextReveal]);

  const front = reverse ? (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">English</p>
      <p className="mt-4 text-2xl text-foreground sm:text-3xl">{card.data.english}</p>
    </div>
  ) : (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Chinese</p>
      <p className="mt-6 hanzi-xl text-foreground">{card.data.chinese}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="paper relative flex min-h-[22rem] flex-col items-center justify-center rounded-2xl p-10 shadow-sm">
        <div className="absolute right-3 top-3">
          <FlagButtons itemKind={card.item_kind} itemId={card.item_id} />
        </div>

        {front}

        {reveal >= 1 && (
          <p className="mt-6 text-center text-lg font-medium tracking-wide text-primary sm:text-xl">{card.data.pinyin}</p>
        )}
        {reveal >= 2 && (
          <p className="mt-4 text-center text-base text-muted-foreground sm:text-lg">
            {reverse ? card.data.chinese : card.data.english}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {reveal < 2 ? (
          <Button size="lg" onClick={nextReveal} className="min-w-48">
            Reveal {reveal === 0 ? "Pinyin" : reverse ? "Chinese" : "English"} <span className="ml-2 text-xs opacity-60">Space</span>
          </Button>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="destructive" onClick={() => mut.mutate("again")}>Again<kbd className="ml-2 opacity-60">1</kbd></Button>
            <Button variant="secondary" onClick={() => mut.mutate("hard")}>Hard<kbd className="ml-2 opacity-60">2</kbd></Button>
            <Button onClick={() => mut.mutate("good")}>Good<kbd className="ml-2 opacity-60">3</kbd></Button>
            <Button variant="outline" onClick={() => mut.mutate("easy")}>Easy<kbd className="ml-2 opacity-60">4</kbd></Button>
          </div>
        )}
      </div>
    </div>
  );
}