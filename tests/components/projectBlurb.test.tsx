import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import ProjectBlurb from "../../components/projectBlurb";
describe("<ProjectBlurb/>", () => {
  it("displays the title and description", async () => {
    render(<ProjectBlurb title={"Test Title"} description={"Test Description"} techs={["angular"]} image={"/icons/angular-icon.png"} />);
    expect(screen.getByRole("heading", { name: /Test Title/i })).toBeVisible();
    expect(screen.getByRole("note")).toBeVisible();
  });
});
