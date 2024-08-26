import React from 'react';

export interface DialogButton<S = void> {
  title: string;
  align?: 'left';
  kind?: 'flat';
  type?: 'submit' | 'button' | 'reset' | 'close';
  action?: (data: S) => void;
}

interface DialogFooterProps<S = void> {
  buttons?: DialogButton<S>[];
  onClose: () => void;
  state?: S;
}

const DialogFooter = <S,>({ buttons = [], onClose, state }: DialogFooterProps<S>) => {
  return buttons.length ? (
    <div data-dialog-footer className="flex justify-end gap-2 p-6">
      {buttons.map((button, index) => (
        <button
          key={index}
          className={`min-w-60px ${button.align === 'left' ? 'mr-auto' : ''}`}
          type={button.type !== 'close' ? button.type : 'button'}
          onClick={() => {
            button.action?.(state as S);
            if (!button.type || button.type === 'close') {
              onClose();
            }
          }}
        >
          {button.title}
        </button>
      ))}
    </div>
  ) : null;
};

export default DialogFooter;