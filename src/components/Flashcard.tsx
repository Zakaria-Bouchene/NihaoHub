import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { recordReview } from "@/lib/authed.functions";
import { useStudy } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { FlagButtons } from "./FlagButtons";
import { getLanguage } from "@/lib/languages";

export interface StudyCard {
  item_kind: "word" | "sentence" | "card" | "passage";
  item_id: string;
  data: {
    id: string;
    // Multilang fields (new cards table)
    source_text?: string;
    transliteration?: string | null;
    target_text?: string;
    source_lang?: string;
    target_lang?: string;
    // Legacy Chinese fields (words/sentences tables)
    chinese?: string;
    pinyin?: string;
    english?: string;
  };
}

/** Normalise legacy Chinese cards and new multilang cards into a single shape */
function normalise(card: StudyCard) {
  const d = card.data;
  if (d.source_text !== undefined) {
    // New multilang card
    return {
      sourceText: d.source_text!,
      transliteration: d.transliteration ?? null,
      targetText: d.target_text!,
      sourceLang: d.source_lang ?? "en",
      targetLang: d.target_lang ?? "??",
    };
  }
  // Legacy Chinese card: map chinese→target, english→source, pinyin→transliteration
  return {
    sourceText: d.english ?? "",
    transliteration: d.pinyin ?? null,
    targetText: d.chinese ?? "",
    sourceLang: "en",
    targetLang: "zh",
  };
}

export function Flashcard({
  card, onNext, reverse = false, activeSourceLang
}: { card: StudyCard; onNext: () => void; reverse?: boolean; activeSourceLang?: string }) {
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
      if (e.code === "Space") { e.preventDefault(); nextReveal(); return; }
      if (reveal < 2) return;
      if (e.key === "1") mut.mutate("again");
      else if (e.key === "2") mut.mutate("hard");
      else if (e.key === "3") mut.mutate("good");
      else if (e.key === "4") mut.mutate("easy");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reveal, mut, nextReveal]);

  const { sourceText, transliteration, targetText, sourceLang, targetLang } = normalise(card);
  const hasTranslit = Boolean(transliteration);

  // If the user's active study language doesn't match the card's native source language, it's a flipped card.
  // Note: 'reverse' mode toggle also flips the card manually.
  const isFlipped = (activeSourceLang && activeSourceLang !== sourceLang) ? true : false;
  const effectiveReverse = reverse !== isFlipped;

  // In normal mode: front = sourceText, step1 = transliteration (if any), step2 = targetText
  // In reverse mode: front = targetText, step1 = transliteration (if any), step2 = sourceText
  const frontLang = effectiveReverse ? targetLang : sourceLang;
  const backLang  = effectiveReverse ? sourceLang : targetLang;
  const frontText = effectiveReverse ? targetText : sourceText;
  const backText  = effectiveReverse ? sourceText : targetText;

  const frontLangObj = getLanguage(frontLang);
  const backLangObj  = getLanguage(backLang);

  // If the card is natively flipped relative to what we're studying, the transliteration belongs to the FRONT text.
  // We should show it immediately alongside the front text, and skip step 1.
  const translitOnFront = isFlipped && !reverse; // The transliteration is on the target_text natively. If we are studying target->source, it's on front.
  // If the user toggled 'reverse' while studying target->source, effectiveReverse=false, front=source, back=target. Transliteration is on back.
  const translitOnBack = isFlipped && reverse; 
  
  // Normal transliteration step logic (only if it's on the back, or we are in normal non-flipped flow)
  const isTranslitMiddleStep = hasTranslit && !isFlipped;

  const maxReveal = isTranslitMiddleStep ? 2 : 1;
  const showMiddleTranslit = isTranslitMiddleStep && reveal >= 1;
  const showBack = isTranslitMiddleStep ? reveal >= 2 : reveal >= 1;

  const revealLabel =
    reveal === 0
      ? isTranslitMiddleStep
        ? `Reveal ${backLangObj?.transliterationLabel ?? "Romanisation"}`
        : `Reveal ${backLangObj?.name ?? "translation"}`
      : reveal === 1 && isTranslitMiddleStep
        ? `Reveal ${backLangObj?.name ?? "translation"}`
        : "";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="paper relative flex min-h-[22rem] flex-col items-center justify-center rounded-2xl p-10 shadow-sm">
        <div className="absolute right-3 top-3">
          <FlagButtons itemKind={card.item_kind} itemId={card.item_id} />
        </div>

        {/* Language badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <span>{frontLangObj?.flag ?? frontLang}</span>
          <span>→</span>
          <span>{backLangObj?.flag ?? backLang}</span>
        </div>

        {/* Front (always visible) */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {frontLangObj?.name ?? frontLang}
          </p>
          <p
            className="mt-4 text-2xl font-medium text-foreground sm:text-3xl"
            dir={frontLangObj?.rtl ? "rtl" : undefined}
          >
            {frontText}
          </p>
          {translitOnFront && hasTranslit && (
            <p className="mt-3 text-lg font-medium text-primary/80">
              {transliteration}
            </p>
          )}
        </div>

        {/* Transliteration (step 1 when available and not on front) */}
        {showMiddleTranslit && (
          <p className="mt-6 text-center text-lg font-medium tracking-wide text-primary sm:text-xl">
            {transliteration}
          </p>
        )}

        {/* Back translation (final step) */}
        {showBack && (
          <div className="mt-4 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {backLangObj?.name ?? backLang}
            </p>
            <p
              className="mt-1 text-base text-foreground sm:text-lg"
              dir={backLangObj?.rtl ? "rtl" : undefined}
            >
              {backText}
            </p>
            {translitOnBack && hasTranslit && (
              <p className="mt-2 text-sm font-medium text-primary/80">
                {transliteration}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {reveal < maxReveal ? (
          <Button size="lg" onClick={nextReveal} className="min-w-48">
            {revealLabel} <span className="ml-2 text-xs opacity-60">Space</span>
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