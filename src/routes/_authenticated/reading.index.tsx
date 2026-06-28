import { createFileRoute } from "@tanstack/react-router";
import { ReadingIndex } from "./reading";

export const Route = createFileRoute("/_authenticated/reading/")({
  component: ReadingIndex,
});