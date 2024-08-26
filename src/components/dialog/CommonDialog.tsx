import React, { ReactNode } from "react";
import Dialog, { DialogProps } from "./Dialog";
import DialogFooter, { DialogButton } from "./DialogFooter";

interface CommonDialogProps<S> extends DialogProps {
  buttons?: DialogButton[] | ((data: S) => DialogButton[]);
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  renderChildren: (props: { data: S; close: () => void }) => ReactNode;
  className?: string;
}

const CommonDialog = <S,>({
  open,
  buttons,
  onSubmit,
  renderChildren,
  className,
  ...props
}: CommonDialogProps<S>) => {
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const getItems = (data: S) =>
    typeof buttons === "function" ? buttons(data) : buttons;

  return (
    <div className={className} {...props}>
      {renderChildren({ data: {} as S, close: () => {} })}
      {/* <DialogFooter buttons={getItems({} as S)} /> */}
    </div>
    // <Dialog open={open} className={className} {...props}>
    //   {({ data, close }) => (
    //     <form method="dialog" className="contents" onSubmit={submitHandler}>
    //       <div
    //         data-dialog-content
    //         className="mt-4 px-6 flex-grow text-onSurfaceVariant"
    //       >
    //         {renderChildren({ data, close })}
    //       </div>
    //       <DialogFooter buttons={getItems(data)} onClose={close} />
    //     </form>
    //   )}
    // </Dialog>
  );
};

export default CommonDialog;
