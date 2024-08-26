import React from 'react';

type Snippet = () => React.ReactNode;

interface WrapTranslationProps<Params extends Record<string, unknown>> {
  messageFn: (value: Params) => string;
  [key: string]: Snippet;
}

const WrapTranslation = <Params extends Record<string, unknown>>({
  messageFn,
  ...props
}: WrapTranslationProps<Params>) => {
  const partMarker = '__PART_MARKER__';
  const valueMarker = '__VALUE_MARKER__';

  const parts = React.useMemo(() => {
    const paramsKeys = Object.keys(props);

    const placeholdersEntries = paramsKeys.map(
      (key) => [key, `${partMarker}${valueMarker}${key}${partMarker}`] as const
    );

    const placeholderParams = Object.fromEntries(placeholdersEntries) as Params;
    const message = messageFn(placeholderParams);

    return message.split(partMarker);
  }, [messageFn, props]);

  return (
    <div>
      {parts.map((part, index) =>
        part.startsWith(valueMarker) ? (
          <React.Fragment key={index}>
            {props[part.replaceAll(valueMarker, '')]?.()}
          </React.Fragment>
        ) : (
          part
        )
      )}
    </div>
  );
};

export default WrapTranslation;