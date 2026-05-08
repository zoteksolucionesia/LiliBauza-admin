"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill-new");
  return RQ;
}, {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse bg-gray-100 rounded-lg" />,
});

interface EditorRicoProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function EditorRico({ value, onChange, label, placeholder, disabled }: EditorRicoProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "align",
  ];

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="bg-white rounded-lg overflow-hidden border">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{ height: "300px", marginBottom: "40px" }}
        />
      </div>
    </div>
  );
}
