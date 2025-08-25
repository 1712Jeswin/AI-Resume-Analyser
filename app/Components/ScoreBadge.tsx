import React from "react";

interface ScoreBadgeProps {
  score: number;
}

// Small reusable badge that maps score to a labeled color badge
// Rules:
//   score > 70  -> green  -> "Strong"
//   score > 49  -> yellow -> "Good Start"
//   else        -> red    -> "Needs Work"
// Styling uses Tailwind utility classes (incl. custom theme colors):
//   bg-badge-green | bg-badge-yellow | bg-badge-red
//   text-badge-green-text | text-badge-yellow-text | text-badge-red-text
// The component returns a styled div with a single p element inside.
const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let label = "Needs Work";
  let bgClass = "bg-badge-red";
  let textClass = "text-red-600"; // also have custom text-badge-red-text defined

  if (score > 70) {
    label = "Strong";
    bgClass = "bg-badge-green";
    textClass = "text-green-600"; // could also use text-badge-green-text
  } else if (score > 49) {
    label = "Good Start";
    bgClass = "bg-badge-yellow";
    textClass = "text-yellow-600"; // could also use text-badge-yellow-text
  }

  return (
    <div className={`score-badge ${bgClass}`}>
      <p className={`text-sm font-medium ${textClass}`}>{label}</p>
    </div>
  );
};

export default ScoreBadge;
