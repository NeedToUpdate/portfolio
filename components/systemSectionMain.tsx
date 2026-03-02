import { useState } from "react";
import { category_lookup } from "./utils/categories";
import { ISystemBlurb, ISystemLink } from "./utils/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SystemDropdown from "./systemDropdown";

export interface ISystemSectionMainProps {
  blurb: ISystemBlurb;
  systems: ISystemLink[];
}

export default function SystemSectionMain(props: ISystemSectionMainProps) {
  const { systems, blurb } = props;

  const categories = systems.reduce((acc: string[], system) => {
    if (!acc.includes(system.details.category)) {
      acc.push(system.details.category);
    }
    return acc;
  }, [] as string[]);

  //sort alphabetically
  categories.sort((a, b) => a.localeCompare(b));

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0],
  );

  return (
    <div>
      <div className="text-center px-4 py-8 sm:py-12 w-full flex flex-col items-center justify-center gap-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-plasma-500 max-w-4xl">
          {blurb.title}
        </h2>
        <div className="text-base md:text-lg text-white/70 sm:max-w-2xl leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blurb.sencence}
          </ReactMarkdown>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full max-w-4xl">
          {blurb.capabilities.map((cap) => (
            <div key={cap.term} className="flex flex-col gap-2 pt-4 border-t border-plasma-500/40 text-left">
              <p className="text-plasma-500 text-xs font-semibold uppercase tracking-widest">{cap.term}</p>
              <p className="text-white/55 text-sm leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl sm:mx-auto px-4 pb-8 space-y-6">
        <p className="text-sm text-white/40 sm:max-w-2xl">
          {blurb.description}
        </p>
        <div className="w-full">
          <div className="grid w-full grid-cols-4 gap-2">
            {categories.map((category) => {
              const Icon = category_lookup[category].icon;
              return (
                <div
                  key={category}
                  className={`flex flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer p-2 sm:p-3 rounded-md duration-200 text-center text-sm font-medium
                    ${
                      selectedCategory === category
                        ? "bg-plasma-500/10 border border-plasma-500 text-plasma-500"
                        : "border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80"
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="w-5 h-5 min-w-5" />
                  <span className="hidden sm:inline">
                    {category_lookup[category].name}
                  </span>
                </div>
              );
            })}
          </div>
          {categories.map((category) => (
            <div
              key={category}
              className={`${
                selectedCategory === category ? "" : "hidden"
              } mt-6`}
            >
              <div className="grid grid-cols-1 gap-3">
                {systems
                  .sort((a, b) => a.details.priority - b.details.priority)
                  .filter((system) => system.details.category === category)
                  .map((system) => (
                    <SystemDropdown key={system.slug} system={system} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
