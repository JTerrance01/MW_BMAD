import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./BlogStyles.css";

const Markdown = ({ content }) => {
  // Return early if content is null, undefined, or empty
  if (!content || content.trim() === "") {
    return <p className="text-muted fst-italic">No content available</p>;
  }

  try {
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  } catch (error) {
    console.error("Error rendering markdown:", error);
    return (
      <p className="text-danger">
        Error rendering content. Please try again later.
      </p>
    );
  }
};

export default Markdown;
