import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SkillIcon from "../../components/skillIcon";

describe("<SkillIcon/>", () => {
  it("renders skill icon with correct name and years", async () => {
    render(<SkillIcon tech="ai-agents" prettyName="AI Agents" years={2} background={0} />);
    
    // Check if the icon appears with the proper alt and title text
    const iconElement = screen.getByAltText("AI Agents");
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute('title', '2 years of experience with AI Agents');
    
    // Check if the skill name is rendered
    const nameElement = screen.getByText("AI Agents");
    expect(nameElement).toBeInTheDocument();
    
    // Check if the years text is rendered
    const yearsElement = screen.getByText("2 years");
    expect(yearsElement).toBeInTheDocument();
  });
});