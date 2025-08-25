import React from "react";

export type ATSSuggestion = {
  type: "good" | "improve";
  tip: string;
};

interface ATSProps {
  score: number; // 0-100
  suggestions: ATSSuggestion[]; // list of suggestions
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  // Determine gradient color and icon based on score
  const gradientFrom = score > 69 ? "from-green-100" : score > 49 ? "from-yellow-100" : "from-red-100";
  const icon = score > 69 ? "/icons/ats-good.svg" : score > 49 ? "/icons/ats-warning.svg" : "/icons/ats-bad.svg";

  return (
    <section className={`w-full rounded-2xl shadow-md bg-gradient-to-b ${gradientFrom} to-white p-6`}>      
      {/* Top section: icon + headline */}
      <div className="flex items-center gap-4 mb-4">
        <img src={icon} alt="ATS indicator" className="h-10 w-10" />
        <h3 className="text-xl font-semibold text-dark-200">ATS Score - {score}/100</h3>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2 mb-4">
        <h4 className="text-lg font-medium text-dark-200">Applicant Tracking System Compatibility</h4>
        <p className="text-sm text-gray-500">
          These insights highlight how well your resume can be parsed and interpreted by common ATS scanners.
          Consider the tips below to maintain strengths and address opportunities for improvement.
        </p>
      </div>

      {/* Suggestions list */}
      <ul className="flex flex-col gap-2 mb-4">
        {suggestions.map((sug, idx) => {
          const sugIcon = sug.type === "good" ? "/icons/check.svg" : "/icons/warning.svg";
          const iconAlt = sug.type === "good" ? "Good" : "Improve";
          return (
            <li key={idx} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
              <img src={sugIcon} alt={`${iconAlt} tip`} className="h-5 w-5 mt-0.5" />
              <span className="text-sm text-gray-700">{sug.tip}</span>
            </li>
          );
        })}
      </ul>

      {/* Closing line */}
      <p className="text-sm text-gray-600">
        Keep refining your resume to boost ATS compatibility and improve your chances of landing interviews.
      </p>
    </section>
  );
};

export default ATS;