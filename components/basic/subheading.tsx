import * as React from "react";

export interface ISubHeadingProps {
  title: string;
  id: string;
}

export function SubHeading(props: ISubHeadingProps) {
  const { title, id } = props;
  return (
    <h4
      title={title}
      id={id}
      role={"heading"}
      aria-level={2}
      className="text-4xl select-none text-nebula-100 font-montserrat font-thin "
    >
      {title}
    </h4>
  );
}
