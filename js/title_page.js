// Wait for the DOM to be fully loaded before executing
document.addEventListener("DOMContentLoaded", function () {
  // Select the title container using D3
  const titleContainer = d3.select("#title-container");

  // Add Bootstrap classes for vertical and horizontal centering
  titleContainer
    .classed("d-flex justify-content-center align-items-center", true)
    .style("height", "100vh"); // Make container full height of viewport

  // Get the dimensions of the container
  const containerWidth = document.getElementById("title-container").clientWidth;
  const containerHeight =
    document.getElementById("title-container").clientHeight;

  // Append an SVG element to the title container
  const svg = titleContainer
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .attr("id", "title-svg");

  // Title text
  const titleText = svg
    .append("text")
    .attr("id", "main-title")
    .attr("x", containerWidth / 2)
    .attr("y", containerHeight / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-family", "Roboto, sans-serif")
    .style("font-size", "72px") // Increased font size for main title
    .style("font-weight", "bold")
    .style("opacity", 0)
    .text("Chess Viz"); // Updated title text

  // Add a transition effect to make the text appear
  titleText
    .transition()
    .duration(1500)
    .style("opacity", 1)
    .on("end", function () {
      // Add a subtle animation after the initial appearance
      d3.select(this)
        .transition()
        .duration(1000)
        .attr("y", containerHeight / 2 - 10)
        .transition()
        .duration(1000)
        .attr("y", containerHeight / 2 + 10)
        .on("end", function () {
          // Add a loop for subtle floating animation
          function repeatAnimation() {
            d3.select(this)
              .transition()
              .duration(2000)
              .attr("y", containerHeight / 2 - 10)
              .transition()
              .duration(2000)
              .attr("y", containerHeight / 2 + 10)
              .on("end", repeatAnimation);
          }
          repeatAnimation.call(this);
        });
    });

  // Add a subtitle
  const subtitle = svg
    .append("text")
    .attr("id", "subtitle")
    .attr("x", containerWidth / 2)
    .attr("y", containerHeight / 2 + 60) // Adjusted position for better spacing
    .attr("text-anchor", "middle")
    .style("font-family", "Roboto, sans-serif")
    .style("font-size", "28px") // Slightly larger subtitle
    .style("opacity", 0)
    .text("Exploring Canadian Chess");

  // Transition for subtitle
  subtitle.transition().delay(1000).duration(1500).style("opacity", 1);

  console.log("Title page SVG with animated text has been created");
});
