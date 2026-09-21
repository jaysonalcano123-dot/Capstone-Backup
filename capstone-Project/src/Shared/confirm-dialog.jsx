import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * CONFIRM DIALOG
 * --------------
 * A styled, promise-based replacement for window.confirm(), so destructive
 * actions (delete, batch delete, archive) ask for confirmation inside the
 * app's own modal instead of a browser popup.
 *
 * Usage in a page component:
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *
 *   async function handleDelete(student) {
 *       const ok = await confirm({
 *           title: 'Delete student',
 *           message: `Delete ${student.fullName}? This also removes their login.`,
 *           confirmLabel: 'Delete',
 *           danger: true,
 *       });
 *       if (!ok) return;
 *       ...
 *   }
 *
 *   // then render it once, anywhere inside the component's JSX:
 *   {confirmDialog}
 *
 * It resolves `true` when the user confirms and `false` when they cancel,
 * close, or press Escape — the same shape as window.confirm(), so existing
 * `if (!window.confirm(...)) return;` lines become
 * `if (!(await confirm(...))) return;`.
 */
export function ConfirmDialog({
    open,
    title = 'Are you sure?',
    message = '',
    details = null,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    busy = false,
    onConfirm,
    onCancel,
}) {
    // Escape closes, Enter confirms — standard dialog keyboard behaviour.
    useEffect(() => {
        if (!open) return undefined;
        function handleKey(event) {
            if (event.key === 'Escape') { event.preventDefault(); onCancel?.(); }
            if (event.key === 'Enter') { event.preventDefault(); onConfirm?.(); }
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onConfirm, onCancel]);

    if (!open) return null;

    return (
        <div className="modal-overlay show-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
            <div className="modal-box confirm-box" role="alertdialog" aria-modal="true" style={{ maxWidth: '460px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span aria-hidden="true" style={{ fontSize: '20px', lineHeight: 1 }}>{danger ? '⚠️' : 'ℹ️'}</span>
                        <h2 className="modal-title" style={{ margin: 0 }}>{title}</h2>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onCancel} disabled={busy}>✕</button>
                </div>

                <div className="modal-body">
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.55 }}>{message}</p>
                    {details && (
                        <div className="confirm-details" style={{
                            marginTop: '12px',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '13px',
                            color: '#374151',
                        }}>
                            {Array.isArray(details)
                                ? (
                                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                        {details.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                )
                                : details}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
                    <button
                        type="button"
                        className="btn-modal-submit"
                        onClick={onConfirm}
                        disabled={busy}
                        style={danger ? { background: '#dc2626', borderColor: '#dc2626' } : undefined}
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useConfirm() {
    const [state, setState] = useState(null);
    const resolverRef = useRef(null);

    const confirm = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options } : (options || {});
        setState({
            title: opts.title || 'Are you sure?',
            message: opts.message || '',
            details: opts.details || null,
            confirmLabel: opts.confirmLabel || 'Confirm',
            cancelLabel: opts.cancelLabel || 'Cancel',
            danger: Boolean(opts.danger),
        });
        return new Promise((resolve) => { resolverRef.current = resolve; });
    }, []);

    const settle = useCallback((value) => {
        setState(null);
        const resolve = resolverRef.current;
        resolverRef.current = null;
        if (resolve) resolve(value);
    }, []);

    // Safety net: if the component unmounts while a dialog is open, resolve
    // false so any awaiting caller doesn't hang forever.
    useEffect(() => () => { resolverRef.current?.(false); }, []);

    const confirmDialog = (
        <ConfirmDialog
            open={Boolean(state)}
            {...(state || {})}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
        />
    );

    return { confirm, confirmDialog };
}

export default ConfirmDialog;