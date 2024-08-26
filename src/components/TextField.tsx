"use client";

import React, { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import * as v from "valibot";

interface TextFieldProps {
  value?: string;
  name: string;
  type?: "text";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  name,
  value = "",
  type = "text",
  placeholder,
  minLength,
  maxLength,
  required,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const id = nanoid(6);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ValidationsSchema = React.useMemo(() => {
    const validators: unknown[] = [v.string()];

    if (required) {
      validators.push(v.minLength(1, "This field is required."));
    }

    if (minLength !== undefined) {
      validators.push(
        v.minLength(minLength, `Minimum length is ${minLength}.`)
      );
    }

    if (maxLength !== undefined) {
      validators.push(
        v.maxLength(maxLength, `Maximum length is ${maxLength}.`)
      );
    }

    return v.pipe(...validators);
  }, [required, minLength, maxLength]);

  const validation = v.safeParse(ValidationsSchema, inputValue);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setCustomValidity(validation.success ? "" : " ");
    }
  }, [validation]);

  return (
    <div className="text-field-container">
      <div className="h-56px flex flex-col rounded-4px border border-outline focus-within:border-primary [&:has(input:user-invalid)]:border-error text-onSurface p-1px focus-within:p-0 focus-within:border-2px">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          name={name}
          id={id}
          type={type}
          required={required}
          className="w-full placeholder:text-onSurfaceVariant appearance-none grow border-none outline-none bg-transparent px-14px"
          placeholder={placeholder}
        />
      </div>
      <div className="text-field-error text-body-sm text-error px-16px mt-4px hidden">
        {validation.issues?.at(0)?.message ?? ""}
      </div>
    </div>
  );
};

export default TextField;
