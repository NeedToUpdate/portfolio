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

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]
  );

  return (
    <div>
      <div className="text-center p-2 sm:p-8 w-full flex flex-col items-center justify-center gap-5">
        <h2 className="text-xl sm:text-xl md:text-3xl font-thin mb-4 text-plasma-500">
          {blurb.title}
        </h2>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="text-sm sm:text-md md:text-lg text-white sm:max-w-2xl"
        >
          {blurb.sencence}
        </ReactMarkdown>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="text-xs sm:text-md md:text-lg text-white text-left sm:max-w-[80vw]"
        >
          {blurb.body}
        </ReactMarkdown>
      </div>
      <div className="w-full max-w-5xl sm:mx-auto p-2  sm:p-6 space-y-8">
        <div defaultValue="data-pipelines" className="w-full">
          <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
            {categories.map((category) => {
              const Icon = category_lookup[category].icon;
              return (
                <div
                  key={category}
                  className={` flex flex-row items-center justify-center gap-2 cursor-pointer p-4 border-2 rounded-md  duration-150 text-center 
                    shadow-md shadow-nebula-500/50 hover:shadow-nebula-100/50
                    ${
                      selectedCategory === category
                        ? "border-plasma-500 text-white shadow-plasma-500/50"
                        : "border-white text-white hover:border-plasma-100 "
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="w-6 h-6 min-w-6" />
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
              } mt-8`}
            >
              <div className="grid grid-cols-1 gap-4 mt-4">
                {systems
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
