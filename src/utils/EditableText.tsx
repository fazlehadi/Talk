"use client";

import React, { useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";

export default function EditableText({
  initialContent,
  name,
  maxLength,
  minLength,
  fontSize,
  onUpdate,
  type
}) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  const pRef = useRef(null);

  useEffect(() => {
    // Get the width of the <p> tag
    const pWidth = pRef.current.getBoundingClientRect().width;
    // Set the initial width of the input field
    inputRef.current.style.width = `${pWidth}px`;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        // Check if content has changed
        if (content !== initialContent) {
          onUpdate(content);
        }
        setIsEditing(false);
      }
    };

    // Add event listener to detect clicks outside the input
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Remove event listener when component unmounts
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [content, initialContent, onUpdate]);

  useEffect(() => {
    // Focus on the input field when editing starts
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    // Update the content object with the new value
    setContent(e.target.value);
  };

  return (
    <div className={`text-${fontSize}`} ref={inputRef}>
      {isEditing ? (
        <>
          <input
            className={`border-none outline-none bg-background p-0 text-${fontSize}`}
            minLength={minLength}
            type={type}
            maxLength={maxLength}
            value={content}
            onChange={handleInputChange}
            name={name}
            ref={inputRef}
          />
        </>
      ) : (
        <p
          className={`text-nowrap inline-block cursor-pointer`}
          ref={pRef}
          onClick={handleEditClick}
        >
          {content}
          <Pencil
            className="h-[14px] w-[14px] inline-block ml-[6px]"
            strokeWidth={2}
            color="#ffffff"
          />
        </p>
      )}
    </div>
  );
}
